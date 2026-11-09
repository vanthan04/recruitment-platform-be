import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { IMailService } from '@/modules/mail/domain/ports/mail.service.port';
import { GlobalExceptionFilter } from '@/common/filters/http-exception.filter';

/**
 * Interview detail/list reads and interview-session lifecycle against a real
 * (test) database: participant-only access (candidate / job-owning recruiter),
 * the one-open-session-per-interview rule (including the DB partial unique
 * index under a concurrent start), and the session being closed when the
 * interview is completed. Same fixture pattern as jobs-applications.e2e-spec.
 */
describe('Interviews & sessions (e2e)', () => {
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

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
  const get = (path: string, token: string) =>
    request(app.getHttpServer()).get(`/api/v1${path}`).set(auth(token));
  const post = (path: string, token: string) =>
    request(app.getHttpServer()).post(`/api/v1${path}`).set(auth(token));
  const patch = (path: string, token: string) =>
    request(app.getHttpServer()).patch(`/api/v1${path}`).set(auth(token));

  const runId = Date.now();
  let recruiterA: string;
  let recruiterB: string;
  let candidateA: string;
  let candidateB: string;
  let interviewId: string;

  it('sets up two recruiters, two candidates, and one scheduled interview', async () => {
    recruiterA = await registerAndLogin(
      `iv-e2e-recruiter-a-${runId}@e2e.test`,
      'RECRUITER',
    );
    recruiterB = await registerAndLogin(
      `iv-e2e-recruiter-b-${runId}@e2e.test`,
      'RECRUITER',
    );
    candidateA = await registerAndLogin(
      `iv-e2e-candidate-a-${runId}@e2e.test`,
      'CANDIDATE',
    );
    candidateB = await registerAndLogin(
      `iv-e2e-candidate-b-${runId}@e2e.test`,
      'CANDIDATE',
    );

    await post('/companies', recruiterA)
      .send({ name: `Interviews E2E Corp A ${runId}` })
      .expect(201);
    await post('/companies', recruiterB)
      .send({ name: `Interviews E2E Corp B ${runId}` })
      .expect(201);

    const job = await post('/jobs', recruiterA)
      .send({
        title: 'Interviews E2E Backend Developer',
        description: 'Build APIs',
        location: 'Remote',
      })
      .expect(201);

    const cv = await request(app.getHttpServer())
      .post('/api/v1/cvs')
      .set(auth(candidateA))
      .field('title', 'Interviews E2E CV')
      .attach('file', Buffer.from('%PDF-1.4 fake e2e cv content'), {
        filename: 'interviews-e2e-cv.pdf',
        contentType: 'application/pdf',
      })
      .expect(201);

    const application = await post('/job-applications', candidateA)
      .send({ jobId: job.body.data.id, cvId: cv.body.data.id })
      .expect(201);

    const interview = await post('/interviews', recruiterA)
      .send({
        jobApplicationId: application.body.data.id,
        scheduledAt: new Date(Date.now() + 2 * 86_400_000).toISOString(),
        meetingLink: 'https://meet.example.com/e2e',
      })
      .expect(201);
    interviewId = interview.body.data.id;
  }, 30000);

  describe('GET /interviews/:id', () => {
    it('shows the candidate their interview with viewerRole CANDIDATE', async () => {
      const res = await get(`/interviews/${interviewId}`, candidateA).expect(
        200,
      );
      expect(res.body.data).toMatchObject({
        id: interviewId,
        viewerRole: 'CANDIDATE',
        jobTitle: 'Interviews E2E Backend Developer',
        status: 'SCHEDULED',
      });
    });

    it('shows the job-owning recruiter the interview with viewerRole RECRUITER', async () => {
      const res = await get(`/interviews/${interviewId}`, recruiterA).expect(
        200,
      );
      expect(res.body.data.viewerRole).toBe('RECRUITER');
    });

    it('rejects another candidate', async () => {
      const res = await get(`/interviews/${interviewId}`, candidateB).expect(
        403,
      );
      expect(res.body.code).toBe('INTERVIEW_ACCESS_NOT_ALLOWED');
    });

    it('rejects another recruiter (holds interview:read, but is not the job owner)', async () => {
      await get(`/interviews/${interviewId}`, recruiterB).expect(403);
    });

    it('404s for an unknown interview', async () => {
      await get(
        '/interviews/00000000-0000-4000-8000-000000000000',
        candidateA,
      ).expect(404);
    });
  });

  describe('GET /interviews', () => {
    it('lists the interview for the candidate and the job-owning recruiter', async () => {
      for (const token of [candidateA, recruiterA]) {
        const res = await get('/interviews', token).expect(200);
        expect(res.body.data.map((i: { id: string }) => i.id)).toEqual([
          interviewId,
        ]);
        expect(res.body.metadata).toMatchObject({ total: 1, page: 1 });
      }
    });

    it('lists nothing for unrelated users', async () => {
      for (const token of [candidateB, recruiterB]) {
        const res = await get('/interviews', token).expect(200);
        expect(res.body.data).toEqual([]);
        expect(res.body.metadata.total).toBe(0);
      }
    });

    it('supports the upcoming filter and rejects an invalid status', async () => {
      const upcoming = await get(
        '/interviews?upcoming=true',
        candidateA,
      ).expect(200);
      expect(upcoming.body.metadata.total).toBe(1);

      const cancelledOnly = await get(
        '/interviews?status=CANCELLED',
        candidateA,
      ).expect(200);
      expect(cancelledOnly.body.metadata.total).toBe(0);

      await get('/interviews?status=NOPE', candidateA).expect(400);
    });
  });

  describe('sessions', () => {
    let sessionId: string;

    it('rejects non-participants starting, listing, or ending a session', async () => {
      await post(`/interviews/${interviewId}/sessions`, candidateB).expect(403);
      await post(`/interviews/${interviewId}/sessions`, recruiterB).expect(403);
      await get(`/interviews/${interviewId}/sessions`, recruiterB).expect(403);
      await patch(
        `/interviews/${interviewId}/sessions/anything/end`,
        recruiterB,
      ).expect(403);
    });

    it('lets the candidate start a session', async () => {
      const res = await post(
        `/interviews/${interviewId}/sessions`,
        candidateA,
      ).expect(201);
      expect(res.body.data).toMatchObject({
        interviewId,
        status: 'IN_PROGRESS',
        endedAt: null,
      });
      sessionId = res.body.data.id;
    });

    it('rejects a second start while one is open', async () => {
      const res = await post(
        `/interviews/${interviewId}/sessions`,
        recruiterA,
      ).expect(400);
      expect(res.body.code).toBe('INTERVIEW_SESSION_ALREADY_OPEN');
    });

    it('lets both participants see the open session', async () => {
      for (const token of [candidateA, recruiterA]) {
        const res = await get(
          `/interviews/${interviewId}/sessions`,
          token,
        ).expect(200);
        expect(res.body.data).toHaveLength(1);
        expect(res.body.data[0]).toMatchObject({
          id: sessionId,
          status: 'IN_PROGRESS',
        });
      }
    });

    it('lets the recruiter end it, and rejects ending it twice', async () => {
      const ended = await patch(
        `/interviews/${interviewId}/sessions/${sessionId}/end`,
        recruiterA,
      ).expect(200);
      expect(ended.body.data.status).toBe('ENDED');

      const again = await patch(
        `/interviews/${interviewId}/sessions/${sessionId}/end`,
        candidateA,
      ).expect(400);
      expect(again.body.code).toBe('INTERVIEW_SESSION_ALREADY_ENDED');
    });

    it('allows only one of two simultaneous starts (DB partial unique index)', async () => {
      const results = await Promise.all([
        post(`/interviews/${interviewId}/sessions`, candidateA),
        post(`/interviews/${interviewId}/sessions`, recruiterA),
      ]);
      expect(results.map((r) => r.status).sort()).toEqual([201, 400]);

      const open = await get(
        `/interviews/${interviewId}/sessions`,
        candidateA,
      ).expect(200);
      expect(
        open.body.data.filter(
          (s: { status: string }) => s.status === 'IN_PROGRESS',
        ),
      ).toHaveLength(1);
    });

    it('closes the open session when the interview is completed, and then refuses new ones', async () => {
      await patch(`/interviews/${interviewId}/complete`, recruiterA).expect(
        200,
      );

      const sessions = await get(
        `/interviews/${interviewId}/sessions`,
        candidateA,
      ).expect(200);
      expect(
        sessions.body.data.every(
          (s: { status: string }) => s.status === 'ENDED',
        ),
      ).toBe(true);

      await post(`/interviews/${interviewId}/sessions`, candidateA).expect(400);
    });
  });
});
