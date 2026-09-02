import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { IMailService } from '@/modules/mail/domain/ports/mail.service.port';
import { GlobalExceptionFilter } from '@/common/filters/http-exception.filter';

/**
 * Exercises the Chat module end-to-end against a real (test) database:
 * register recruiter + candidate -> job -> apply -> accept -> create
 * conversation -> send messages both ways -> paginate -> mark read ->
 * authorization is enforced against a third, unrelated user.
 */
describe('Chat module (e2e)', () => {
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
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalFilters(new GlobalExceptionFilter());
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

  async function registerAndLogin(email: string, role: 'CANDIDATE' | 'RECRUITER'): Promise<string> {
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password: 'password123', fullName: `E2E ${role}`, role })
      .expect(201);

    const code = extractVerifyCode(email);
    await request(app.getHttpServer()).post('/api/v1/auth/verify').send({ code }).expect(200);

    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: 'password123' })
      .expect(200);

    return loginRes.body.data.access_token;
  }

  const runId = Date.now();
  let recruiterToken: string;
  let candidateToken: string;
  let strangerToken: string;
  let jobId: string;
  let applicationId: string;
  let conversationId: string;

  it('sets up recruiter, candidate, stranger, job, CV and an ACCEPTED application', async () => {
    recruiterToken = await registerAndLogin(`chat-recruiter-${runId}@e2e.test`, 'RECRUITER');
    candidateToken = await registerAndLogin(`chat-candidate-${runId}@e2e.test`, 'CANDIDATE');
    strangerToken = await registerAndLogin(`chat-stranger-${runId}@e2e.test`, 'CANDIDATE');

    await request(app.getHttpServer())
      .post('/api/v1/companies')
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({ name: `Chat E2E Corp ${runId}` })
      .expect(201);

    const jobRes = await request(app.getHttpServer())
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({ title: 'Chat E2E Backend Developer', description: 'Build APIs', location: 'Remote' })
      .expect(201);
    jobId = jobRes.body.data.id;

    const cvRes = await request(app.getHttpServer())
      .post('/api/v1/cvs')
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({ title: 'Chat E2E CV', experiences: [{ company: 'Acme', position: 'Engineer', startDate: '2020-01-01', isCurrent: true }] })
      .expect(201);
    const cvId = cvRes.body.data.id;
    await request(app.getHttpServer())
      .patch(`/api/v1/cvs/${cvId}/publish`)
      .set('Authorization', `Bearer ${candidateToken}`)
      .expect(200);

    const applyRes = await request(app.getHttpServer())
      .post('/api/v1/job-applications')
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({ jobId, cvId })
      .expect(201);
    applicationId = applyRes.body.data.id;

    await request(app.getHttpServer())
      .patch(`/api/v1/job-applications/${applicationId}/status`)
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({ status: 'ACCEPTED' })
      .expect(200);
  });

  it('refuses to let a candidate create a conversation (recruiter-only endpoint)', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/conversations')
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({ applicationId })
      .expect(403);
  });

  it('creates a conversation as the recruiter (idempotent on retry)', async () => {
    const res1 = await request(app.getHttpServer())
      .post('/api/v1/conversations')
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({ applicationId })
      .expect(201);
    conversationId = res1.body.data.id;
    expect(res1.body.data.jobId).toBe(jobId);
    expect(res1.body.data.applicationId).toBe(applicationId);

    const res2 = await request(app.getHttpServer())
      .post('/api/v1/conversations')
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({ applicationId })
      .expect(201);
    expect(res2.body.data.id).toBe(conversationId);
  });

  it('rejects a stranger from reading the conversation', async () => {
    await request(app.getHttpServer())
      .get(`/api/v1/conversations/${conversationId}`)
      .set('Authorization', `Bearer ${strangerToken}`)
      .expect(403);
  });

  it('lets both members send messages, and is idempotent on clientMessageId retry', async () => {
    const clientMessageId = '11111111-1111-4111-8111-111111111111';
    const send1 = await request(app.getHttpServer())
      .post(`/api/v1/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({ content: 'Hi, thanks for applying!', clientMessageId })
      .expect(201);

    const send2 = await request(app.getHttpServer())
      .post(`/api/v1/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({ content: 'Hi, thanks for applying!', clientMessageId })
      .expect(201);

    expect(send2.body.data.id).toBe(send1.body.data.id);

    await request(app.getHttpServer())
      .post(`/api/v1/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({ content: 'Thank you! When can we talk?', clientMessageId: '22222222-2222-4222-8222-222222222222' })
      .expect(201);
  });

  it('paginates messages oldest-first within a page', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${candidateToken}`)
      .expect(200);

    expect(res.body.data.length).toBe(2);
    expect(new Date(res.body.data[0].createdAt).getTime()).toBeLessThanOrEqual(
      new Date(res.body.data[1].createdAt).getTime(),
    );
  });

  it('marks the conversation as read and reflects it in the conversation list', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/conversations/${conversationId}/read`)
      .set('Authorization', `Bearer ${candidateToken}`)
      .expect(200);

    const listRes = await request(app.getHttpServer())
      .get('/api/v1/conversations')
      .set('Authorization', `Bearer ${candidateToken}`)
      .expect(200);

    const conversation = listRes.body.data.find((c: any) => c.id === conversationId);
    expect(conversation.unreadCount).toBe(0);
  });
});
