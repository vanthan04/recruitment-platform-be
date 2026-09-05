import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { IMailService } from '@/modules/mail/domain/ports/mail.service.port';
import { GlobalExceptionFilter } from '@/common/filters/http-exception.filter';
import { PrismaService } from '@/modules/prisma/prisma.service';

/**
 * Exercises the auth session lifecycle (refresh rotation, logout, blocked-
 * account enforcement) and the admin self-lockout guards end-to-end — the
 * class of regression unit tests can't catch, since it depends on the real
 * HTTP -> guard -> handler -> DB chain wiring up correctly together.
 *
 * No CV/S3 interaction anywhere in this file (unlike app.e2e-spec.ts),
 * so it has no dependency on a real S3-compatible backend being reachable.
 */
describe('Auth session lifecycle + admin guards (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const sentEmails: { to: string; text?: string }[] = [];

  const mailServiceMock: IMailService = {
    sendEmail: jest.fn((options: any) => {
      sentEmails.push(options);
      return Promise.resolve();
    }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(IMailService)
      .useValue(mailServiceMock)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(app.get(GlobalExceptionFilter));
    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  function extractVerifyCode(email: string): string {
    const sent = [...sentEmails].reverse().find((e) => e.to === email);
    const match = sent?.text?.match(/:\s*(\w+)\s*$/);
    if (!match) throw new Error(`No verification code captured for ${email}`);
    return match[1];
  }

  // The login/register endpoints are deliberately rate-limited (5/min) as a
  // brute-force defense — this suite is careful to stay well under that
  // budget itself (registerAndVerify never logs in; a token is fetched only
  // where a test actually exercises the login/refresh path itself, and
  // later steps reuse a still-valid refresh token via rotation instead of a
  // fresh login wherever the scenario allows it).
  async function registerAndVerify(
    email: string,
    role: 'CANDIDATE' | 'RECRUITER',
  ): Promise<{ userId: string }> {
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password: 'password123', fullName: 'E2E User', role })
      .expect(201);

    const code = extractVerifyCode(email);
    await request(app.getHttpServer())
      .post('/api/v1/auth/verify')
      .send({ code })
      .expect(200);

    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    return { userId: user.id };
  }

  async function login(
    email: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: 'password123' })
      .expect(200);
    return {
      accessToken: loginRes.body.data.access_token,
      refreshToken: loginRes.body.data.refresh_token,
    };
  }

  async function registerVerifyLogin(
    email: string,
    role: 'CANDIDATE' | 'RECRUITER',
  ): Promise<{ userId: string; accessToken: string; refreshToken: string }> {
    const { userId } = await registerAndVerify(email, role);
    const tokens = await login(email);
    return { userId, ...tokens };
  }

  /** Promotes an already-registered+verified user straight to ADMIN via direct DB access — no public API mints admin accounts. */
  async function promoteToAdmin(userId: string): Promise<void> {
    const adminRole = await prisma.role.findUniqueOrThrow({
      where: { name: 'ADMIN' },
    });
    await prisma.user.update({
      where: { id: userId },
      data: { roleId: adminRole.id },
    });
  }

  const runId = Date.now();

  describe('refresh token rotation and logout', () => {
    const email = `session-${runId}@e2e.test`;
    let refreshToken: string;

    it('logs in and receives a working access/refresh token pair', async () => {
      const session = await registerVerifyLogin(email, 'CANDIDATE');
      refreshToken = session.refreshToken;

      await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${session.accessToken}`)
        .expect(200);
    });

    it('rotates to a new token pair and rejects reusing the old (now-revoked) refresh token', async () => {
      const refreshRes = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      const newRefreshToken = refreshRes.body.data.refresh_token;
      expect(newRefreshToken).toEqual(expect.any(String));
      expect(newRefreshToken).not.toBe(refreshToken);

      // The just-rotated-away token is single-use — reusing it must fail.
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(403);

      refreshToken = newRefreshToken;
    });

    it('logout revokes the refresh token — refreshing with it afterward fails', async () => {
      // One more rotation (not a fresh login) to get a token pair for this
      // test, to stay well under the login endpoint's rate limit.
      const refreshRes = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);
      const accessToken = refreshRes.body.data.access_token;
      const freshRefreshToken = refreshRes.body.data.refresh_token;

      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken: freshRefreshToken })
        .expect(200);

      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: freshRefreshToken })
        .expect(403);
    });
  });

  describe('blocked account enforcement', () => {
    const adminEmail = `admin-${runId}@e2e.test`;
    const targetEmail = `target-${runId}@e2e.test`;
    let adminAccessToken: string;
    let adminUserId: string;
    let targetUserId: string;
    let targetRefreshToken: string;

    beforeAll(async () => {
      const admin = await registerAndVerify(adminEmail, 'CANDIDATE');
      await promoteToAdmin(admin.userId);
      adminUserId = admin.userId;
      // Only ever log this account in once, after promotion, so the access
      // token actually carries the ADMIN role claim.
      const adminTokens = await login(adminEmail);
      adminAccessToken = adminTokens.accessToken;

      const target = await registerAndVerify(targetEmail, 'CANDIDATE');
      targetUserId = target.userId;
      const targetTokens = await login(targetEmail);
      targetRefreshToken = targetTokens.refreshToken;
    });

    it('an admin blocking a user immediately revokes that session — refresh fails without waiting for access-token expiry', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/admin/users/${targetUserId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ status: 'BLOCKED' })
        .expect(200);

      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: targetRefreshToken })
        .expect(403);
    });

    it('a blocked user can no longer log in at all', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: targetEmail, password: 'password123' })
        .expect(403);
    });

    it('an admin cannot block their own account', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/admin/users/${adminUserId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ status: 'BLOCKED' })
        .expect(400);
    });

    it('an admin cannot demote their own role', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/admin/users/${adminUserId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ role: 'CANDIDATE' })
        .expect(400);
    });
  });

  describe('forgot-password account enumeration', () => {
    it('returns the identical response for a registered and an unregistered email', async () => {
      const email = `forgot-${runId}@e2e.test`;
      await registerAndVerify(email, 'CANDIDATE');

      const [existingRes, nonexistentRes] = await Promise.all([
        request(app.getHttpServer())
          .post('/api/v1/auth/forgot-password')
          .send({ email })
          .expect(200),
        request(app.getHttpServer())
          .post('/api/v1/auth/forgot-password')
          .send({ email: `nobody-${runId}@e2e.test` })
          .expect(200),
      ]);

      expect(existingRes.body.message).toBe(nonexistentRes.body.message);
    });
  });
});
