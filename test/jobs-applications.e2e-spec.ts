import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { IMailService } from '@/modules/mail/domain/ports/mail.service.port';
import { GlobalExceptionFilter } from '@/common/filters/http-exception.filter';

/**
 * Negative-path / cross-role authorization coverage for jobs and job
 * applications against a real (test) database — the RBAC guard chain
 * (permission-gated) is exercised end to end, but so is the
 * ownership-check layer underneath it: a recruiter who genuinely holds
 * JOB_UPDATE/APPLICATION_UPDATE etc. must still be rejected when the
 * resource in question isn't theirs. The happy paths for these same
 * endpoints are already covered by app.e2e-spec.ts and chat.e2e-spec.ts;
 * this suite is deliberately only the rejection cases, following the same
 * pattern chat.e2e-spec.ts already established for conversations.
 */
describe('Jobs & applications — negative paths (e2e)', () => {
  let app: INestApplication<App>;
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
      // See app.e2e-spec.ts's matching override for why.
      .overrideGuard(APP_GUARD)
      .useValue({ canActivate: () => true })
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

  async function registerAndLogin(
    email: string,
    role: 'CANDIDATE' | 'RECRUITER',
  ): Promise<string> {
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password: 'password123', fullName: `E2E ${role}`, role })
      .expect(201);

    const code = extractVerifyCode(email);
    await request(app.getHttpServer())
      .post('/api/v1/auth/verify')
      .send({ code })
      .expect(200);

    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: 'password123' })
      .expect(200);

    return loginRes.body.data.access_token;
  }

  const runId = Date.now();
  let recruiterAToken: string;
  let recruiterBToken: string;
  let candidateAToken: string;
  let candidateBToken: string;
  let jobAId: string;
  let closedJobBId: string;
  let cvAId: string;
  let applicationAId: string;

  it('sets up two recruiters (each with their own company+job), two candidates, a CV, and one application', async () => {
    recruiterAToken = await registerAndLogin(
      `jobs-e2e-recruiter-a-${runId}@e2e.test`,
      'RECRUITER',
    );
    recruiterBToken = await registerAndLogin(
      `jobs-e2e-recruiter-b-${runId}@e2e.test`,
      'RECRUITER',
    );
    candidateAToken = await registerAndLogin(
      `jobs-e2e-candidate-a-${runId}@e2e.test`,
      'CANDIDATE',
    );
    candidateBToken = await registerAndLogin(
      `jobs-e2e-candidate-b-${runId}@e2e.test`,
      'CANDIDATE',
    );

    await request(app.getHttpServer())
      .post('/api/v1/companies')
      .set('Authorization', `Bearer ${recruiterAToken}`)
      .send({ name: `Jobs E2E Corp A ${runId}` })
      .expect(201);
    await request(app.getHttpServer())
      .post('/api/v1/companies')
      .set('Authorization', `Bearer ${recruiterBToken}`)
      .send({ name: `Jobs E2E Corp B ${runId}` })
      .expect(201);

    const jobARes = await request(app.getHttpServer())
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${recruiterAToken}`)
      .send({
        title: 'Jobs E2E Backend Developer A',
        description: 'Build APIs',
        location: 'Remote',
      })
      .expect(201);
    jobAId = jobARes.body.data.id;

    const jobBRes = await request(app.getHttpServer())
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${recruiterBToken}`)
      .send({
        title: 'Jobs E2E Backend Developer B',
        description: 'Build APIs',
        location: 'Remote',
      })
      .expect(201);
    closedJobBId = jobBRes.body.data.id;
    await request(app.getHttpServer())
      .patch(`/api/v1/jobs/${closedJobBId}/close`)
      .set('Authorization', `Bearer ${recruiterBToken}`)
      .expect(200);

    const cvRes = await request(app.getHttpServer())
      .post('/api/v1/cvs')
      .set('Authorization', `Bearer ${candidateAToken}`)
      .field('title', 'Jobs E2E CV')
      .attach('file', Buffer.from('%PDF-1.4 fake e2e cv content'), {
        filename: 'jobs-e2e-cv.pdf',
        contentType: 'application/pdf',
      })
      .expect(201);
    cvAId = cvRes.body.data.id;

    const applyRes = await request(app.getHttpServer())
      .post('/api/v1/job-applications')
      .set('Authorization', `Bearer ${candidateAToken}`)
      .send({ jobId: jobAId, cvId: cvAId })
      .expect(201);
    applicationAId = applyRes.body.data.id;
  }, 20000);

  describe('job mutation endpoints', () => {
    it('rejects a candidate creating a job (lacks JOB_CREATE entirely)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/jobs')
        .set('Authorization', `Bearer ${candidateAToken}`)
        .send({ title: 'Hijacked posting', description: 'x', location: 'x' })
        .expect(403);
    });

    it("rejects a recruiter updating another recruiter's job (has JOB_UPDATE, but not ownership)", async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/jobs/${jobAId}`)
        .set('Authorization', `Bearer ${recruiterBToken}`)
        .send({ title: 'Hijacked title' })
        .expect(403);
    });

    it("rejects a recruiter deleting another recruiter's job", async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/jobs/${jobAId}`)
        .set('Authorization', `Bearer ${recruiterBToken}`)
        .expect(403);
    });

    it("rejects a recruiter closing another recruiter's job", async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/jobs/${jobAId}/close`)
        .set('Authorization', `Bearer ${recruiterBToken}`)
        .expect(403);
    });
  });

  describe('applying to a job', () => {
    it('rejects applying twice to the same job', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/job-applications')
        .set('Authorization', `Bearer ${candidateAToken}`)
        .send({ jobId: jobAId, cvId: cvAId })
        .expect(409);
    });

    it('rejects applying to a closed job', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/job-applications')
        .set('Authorization', `Bearer ${candidateAToken}`)
        .send({ jobId: closedJobBId, cvId: cvAId })
        .expect(400);
    });
  });

  describe('reading and mutating an application across roles', () => {
    it('rejects a candidate listing applications for a job (recruiter-only endpoint)', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/job-applications/job/${jobAId}`)
        .set('Authorization', `Bearer ${candidateAToken}`)
        .expect(403);
    });

    it("rejects a recruiter listing another recruiter's job applications", async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/job-applications/job/${jobAId}`)
        .set('Authorization', `Bearer ${recruiterBToken}`)
        .expect(403);
    });

    it("rejects a recruiter updating the status of another recruiter's job application", async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/job-applications/${applicationAId}/status`)
        .set('Authorization', `Bearer ${recruiterBToken}`)
        .send({ status: 'SCREENING' })
        .expect(403);
    });

    it('rejects a candidate updating an application status (lacks APPLICATION_UPDATE entirely)', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/job-applications/${applicationAId}/status`)
        .set('Authorization', `Bearer ${candidateAToken}`)
        .send({ status: 'SCREENING' })
        .expect(403);
    });

    it("rejects a stranger withdrawing someone else's application", async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/job-applications/${applicationAId}/withdraw`)
        .set('Authorization', `Bearer ${candidateBToken}`)
        .expect(403);
    });
  });
});
