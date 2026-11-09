import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { IMailService } from '@/modules/mail/domain/ports/mail.service.port';
import { GlobalExceptionFilter } from '@/common/filters/http-exception.filter';
import { PrismaService } from '@/modules/prisma/prisma.service';

/**
 * Monitoring events (Phase 4) over HTTP against a real (test) database:
 * who can read the timeline and summary, who can review, and that the
 * recruiter's review note stays private. Events are inserted directly — the
 * frame → AI → event path is covered by unit tests (it needs the AI service).
 */
describe('Monitoring events (e2e)', () => {
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
  let sessionId: string;
  let phoneEventId: string;

  it('sets up an interview in the room with an open session and three events', async () => {
    recruiterA = await registerAndLogin(
      `mon-e2e-ra-${runId}@e2e.test`,
      'RECRUITER',
    );
    recruiterB = await registerAndLogin(
      `mon-e2e-rb-${runId}@e2e.test`,
      'RECRUITER',
    );
    candidateA = await registerAndLogin(
      `mon-e2e-ca-${runId}@e2e.test`,
      'CANDIDATE',
    );
    candidateB = await registerAndLogin(
      `mon-e2e-cb-${runId}@e2e.test`,
      'CANDIDATE',
    );

    await post('/companies', recruiterA)
      .send({ name: `Monitoring E2E Corp ${runId}` })
      .expect(201);
    const job = await post('/jobs', recruiterA)
      .send({
        title: 'Monitoring E2E Developer',
        description: 'x',
        location: 'Remote',
      })
      .expect(201);
    const cv = await request(app.getHttpServer())
      .post('/api/v1/cvs')
      .set(auth(candidateA))
      .field('title', 'Monitoring E2E CV')
      .attach('file', Buffer.from('%PDF-1.4 fake e2e cv content'), {
        filename: 'mon-e2e-cv.pdf',
        contentType: 'application/pdf',
      })
      .expect(201);
    const application = await post('/job-applications', candidateA)
      .send({ jobId: job.body.data.id, cvId: cv.body.data.id })
      .expect(201);
    const interview = await post('/interviews', recruiterA)
      .send({
        jobApplicationId: application.body.data.id,
        scheduledAt: new Date(Date.now() + 86_400_000).toISOString(),
        useRoom: true,
      })
      .expect(201);
    interviewId = interview.body.data.id;
    const session = await post(
      `/interviews/${interviewId}/sessions`,
      candidateA,
    ).expect(201);
    sessionId = session.body.data.id;

    const base = new Date('2026-11-09T10:00:00Z').getTime();
    const phone = await prisma.interviewDetectionEvent.create({
      data: {
        interviewSessionId: sessionId,
        eventType: 'PHONE_DETECTED',
        objectClass: 'cell phone',
        confidence: 0.83,
        detectedAt: new Date(base + 60_000),
        endedAt: new Date(base + 72_000),
        frameCount: 12,
        metadata: { personCount: 1, endReason: 'condition-cleared' },
      },
    });
    phoneEventId = phone.id;
    await prisma.interviewDetectionEvent.createMany({
      data: [
        {
          interviewSessionId: sessionId,
          eventType: 'PERSON_ABSENT',
          objectClass: 'person',
          confidence: 1,
          detectedAt: new Date(base),
          endedAt: new Date(base + 5_000),
          frameCount: 5,
        },
        {
          interviewSessionId: sessionId,
          eventType: 'PHONE_DETECTED',
          objectClass: 'cell phone',
          confidence: 0.7,
          detectedAt: new Date(base + 120_000),
          frameCount: 3,
        },
      ],
    });
  }, 30000);

  describe('GET /interviews/:id/detection-events', () => {
    it('gives participants the timeline, oldest first', async () => {
      for (const token of [candidateA, recruiterA]) {
        const res = await get(
          `/interviews/${interviewId}/detection-events`,
          token,
        ).expect(200);
        expect(res.body.metadata).toMatchObject({ total: 3, page: 1 });
        expect(
          res.body.data.map((e: { eventType: string }) => e.eventType),
        ).toEqual(['PERSON_ABSENT', 'PHONE_DETECTED', 'PHONE_DETECTED']);
        expect(res.body.data[1]).toMatchObject({
          sessionId,
          durationMs: 12_000,
          frameCount: 12,
        });
        expect(res.body.data[2]).toMatchObject({
          endedAt: null,
          durationMs: null,
        });
      }
    });

    it('filters by type and validates the filter', async () => {
      const res = await get(
        `/interviews/${interviewId}/detection-events?eventType=PHONE_DETECTED`,
        recruiterA,
      ).expect(200);
      expect(res.body.metadata.total).toBe(2);
      await get(
        `/interviews/${interviewId}/detection-events?eventType=CHEATING`,
        recruiterA,
      ).expect(400);
    });

    it('refuses other recruiters and candidates, and 404s an unknown interview', async () => {
      for (const token of [recruiterB, candidateB]) {
        const res = await get(
          `/interviews/${interviewId}/detection-events`,
          token,
        ).expect(403);
        expect(res.body.code).toBe('INTERVIEW_ACCESS_NOT_ALLOWED');
      }
      await get(
        '/interviews/00000000-0000-4000-8000-000000000000/detection-events',
        recruiterA,
      ).expect(404);
    });
  });

  describe('GET /interviews/:id/detection-summary', () => {
    it('counts the persisted events per type and per session', async () => {
      const res = await get(
        `/interviews/${interviewId}/detection-summary`,
        recruiterA,
      ).expect(200);
      expect(res.body.data).toMatchObject({
        totalEvents: 3,
        unreviewedEvents: 3,
        byType: {
          PERSON_ABSENT: 1,
          MULTIPLE_PERSONS: 0,
          PHONE_DETECTED: 2,
          LAPTOP_DETECTED: 0,
        },
      });
      expect(res.body.data.sessions).toEqual([
        expect.objectContaining({
          sessionId,
          totalEvents: 3,
          monitoringConsentAt: null,
        }),
      ]);
      await get(
        `/interviews/${interviewId}/detection-summary`,
        candidateB,
      ).expect(403);
    });
  });

  describe('PATCH /monitoring/events/:id/review', () => {
    it('refuses the candidate (no interview:update permission)', async () => {
      await patch(`/monitoring/events/${phoneEventId}/review`, candidateA)
        .send({})
        .expect(403);
    });

    it('answers not-found to another recruiter', async () => {
      await patch(`/monitoring/events/${phoneEventId}/review`, recruiterB)
        .send({})
        .expect(404);
    });

    it('lets the job recruiter review with a private note', async () => {
      const res = await patch(
        `/monitoring/events/${phoneEventId}/review`,
        recruiterA,
      )
        .send({ note: 'Đã hỏi lại ứng viên' })
        .expect(200);
      expect(res.body.data).toMatchObject({
        id: phoneEventId,
        reviewNote: 'Đã hỏi lại ứng viên',
      });
      expect(res.body.data.reviewedAt).toBeTruthy();

      const reviewed = await get(
        `/interviews/${interviewId}/detection-events?reviewed=true`,
        recruiterA,
      ).expect(200);
      expect(reviewed.body.data.map((e: { id: string }) => e.id)).toEqual([
        phoneEventId,
      ]);

      const summary = await get(
        `/interviews/${interviewId}/detection-summary`,
        recruiterA,
      ).expect(200);
      expect(summary.body.data.unreviewedEvents).toBe(2);
    });

    it('shows the candidate that an event was reviewed, but not the note', async () => {
      const res = await get(
        `/interviews/${interviewId}/detection-events?reviewed=true`,
        candidateA,
      ).expect(200);
      expect(res.body.data[0].reviewedAt).toBeTruthy();
      expect(res.body.data[0]).not.toHaveProperty('reviewNote');
      expect(res.body.data[0]).not.toHaveProperty('reviewedById');
    });

    it('rejects an over-long note', async () => {
      await patch(`/monitoring/events/${phoneEventId}/review`, recruiterA)
        .send({ note: 'x'.repeat(1001) })
        .expect(400);
    });
  });
});
