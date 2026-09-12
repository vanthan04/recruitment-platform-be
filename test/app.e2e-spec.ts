import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { IMailService } from '@/modules/mail/domain/ports/mail.service.port';
import { GlobalExceptionFilter } from '@/common/filters/http-exception.filter';

/**
 * Exercises the core candidate/recruiter journey end-to-end against a real
 * (test) database: register -> verify -> login -> create company/job ->
 * create + publish CV -> apply to the job.
 *
 * The mail provider is overridden with an in-memory stub so no real emails
 * are sent; verification codes are read back from the captured calls.
 */
describe('Job portal core flow (e2e)', () => {
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

  const runId = Date.now();
  const recruiterEmail = `recruiter-${runId}@e2e.test`;
  const candidateEmail = `candidate-${runId}@e2e.test`;
  const password = 'password123';

  let recruiterToken: string;
  let candidateToken: string;
  let companyId: string;
  let jobId: string;
  let cvId: string;

  it('registers, verifies and logs in a recruiter', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: recruiterEmail,
        password,
        fullName: 'Recruiter E2E',
        role: 'RECRUITER',
      })
      .expect(201);

    const code = extractVerifyCode(recruiterEmail);
    await request(app.getHttpServer())
      .post('/api/v1/auth/verify')
      .send({ code })
      .expect(200);

    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: recruiterEmail, password })
      .expect(200);

    recruiterToken = loginRes.body.data.access_token;
    expect(recruiterToken).toEqual(expect.any(String));
  });

  it('creates a company and a job as the recruiter', async () => {
    const companyRes = await request(app.getHttpServer())
      .post('/api/v1/companies')
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({ name: `E2E Corp ${runId}` })
      .expect(201);
    companyId = companyRes.body.data.id;
    expect(companyId).toEqual(expect.any(String));

    const jobRes = await request(app.getHttpServer())
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({
        title: 'E2E Backend Developer',
        description: 'Build APIs',
        location: 'Remote',
      })
      .expect(201);
    jobId = jobRes.body.data.id;
    expect(jobRes.body.data.companyId).toBe(companyId);
  });

  it('registers, verifies and logs in a candidate', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: candidateEmail,
        password,
        fullName: 'Candidate E2E',
        role: 'CANDIDATE',
      })
      .expect(201);

    const code = extractVerifyCode(candidateEmail);
    await request(app.getHttpServer())
      .post('/api/v1/auth/verify')
      .send({ code })
      .expect(200);

    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: candidateEmail, password })
      .expect(200);

    candidateToken = loginRes.body.data.access_token;
    expect(candidateToken).toEqual(expect.any(String));
  });

  it('uploads a CV file as the candidate', async () => {
    // CV is file-only: creation is a multipart upload and requires a real
    // storage backend (S3) to be reachable — this test needs valid
    // S3_* env vars, unlike the rest of this suite which only needs the DB.
    const cvRes = await request(app.getHttpServer())
      .post('/api/v1/cvs')
      .set('Authorization', `Bearer ${candidateToken}`)
      .field('title', 'My E2E CV')
      .attach('file', Buffer.from('%PDF-1.4 fake e2e cv content'), {
        filename: 'my-e2e-cv.pdf',
        contentType: 'application/pdf',
      })
      .expect(201);
    cvId = cvRes.body.data.id;
    expect(cvRes.body.data.status).toBe('PUBLISHED');
    expect(cvRes.body.data.originalName).toBe('my-e2e-cv.pdf');
  });

  it('applies to the job as the candidate', async () => {
    const applyRes = await request(app.getHttpServer())
      .post('/api/v1/job-applications')
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({ jobId, cvId, coverLetter: 'Please consider me' })
      .expect(201);

    expect(applyRes.body.data.status).toBe('APPLIED');

    const myApps = await request(app.getHttpServer())
      .get('/api/v1/job-applications/my-applications')
      .set('Authorization', `Bearer ${candidateToken}`)
      .expect(200);

    expect(myApps.body.data).toEqual(
      expect.arrayContaining([expect.objectContaining({ jobId, cvId })]),
    );
  });
});
