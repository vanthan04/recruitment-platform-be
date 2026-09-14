import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AIMessage, BaseMessage, ToolMessage } from '@langchain/core/messages';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { AppModule } from './../src/app.module';
import { IMailService } from '@/modules/mail/domain/ports/mail.service.port';
import { GlobalExceptionFilter } from '@/common/filters/http-exception.filter';
import {
  MATCHING_CHAT_MODEL,
  CV_ANALYSIS_CHAT_MODEL,
} from '@/modules/ai/infrastructure/providers/chat-model.provider';
import { EXTRACT_CV_ANALYSIS_TOOL_NAME } from '@/modules/ai/schemas/cv-analysis-extraction.schema';
import { SUBMIT_MATCHING_RESULT_TOOL_NAME } from '@/modules/ai/schemas/matching-result.schema';
import { ICvAnalysisRepository } from '@/modules/ai/domain/repositories/cv-analysis.repository';
import { CvTextExtractor } from '@/modules/ai/infrastructure/text-extraction/cv-text-extractor';
import { CvAnalysisStatus } from '@/modules/ai/domain/value-objects/cv-analysis-status.vo';

/**
 * The one path the AI feature never gets exercised end-to-end elsewhere
 * (flagged in the code review, F11): candidate uploads a CV -> the
 * `cv.uploaded` listener analyzes it in the background against a real
 * Postgres row -> once COMPLETED, a recruiter's "Find Matching Candidates"
 * call finds that real candidate through the actual searchCandidatePool
 * query (not a mock). Only the two LLM calls themselves are faked
 * (MATCHING_CHAT_MODEL / CV_ANALYSIS_CHAT_MODEL, the app's DI tokens for
 * them, overridden below) — everything else (DB writes/reads, the
 * cv.uploaded event, the tool-calling LangGraph loop, the applicant-pool
 * scoping added for the code review's F6) runs for real.
 *
 * CvTextExtractor is also overridden — not because it shouldn't run for
 * real, but because pdf-parse's underlying pdf.js sets up a "fake worker"
 * via a dynamic import() that ts-jest's CommonJS test environment can't
 * satisfy without --experimental-vm-modules (confirmed: the exact same
 * hand-built PDF parses fine under plain Node — this is a Jest/pdf.js
 * environment mismatch, not a real app bug). Faking text extraction here
 * is the same trade-off IMailService already makes for email — the code
 * path this test actually exists to prove (upload -> analyze -> match
 * against a real DB row) doesn't depend on pdf.js's internals.
 */
describe('AI candidate matching, full path (e2e)', () => {
  let app: INestApplication<App>;
  let cvAnalysisRepository: ICvAnalysisRepository;
  const sentEmails: { to: string; text?: string }[] = [];

  const mailServiceMock: IMailService = {
    sendEmail: jest.fn((options: any) => {
      sentEmails.push(options);
      return Promise.resolve();
    }),
  };

  /**
   * The extraction call is a one-shot forced tool-choice invoke (see
   * CvAnalysisService.extract) — always returns the same canned
   * extract_cv_analysis args, regardless of the actual CV text sent to it.
   */
  const cvAnalysisChatModelMock: BaseChatModel = {
    bindTools: () => ({
      invoke: async () =>
        new AIMessage({
          content: '',
          tool_calls: [
            {
              name: EXTRACT_CV_ANALYSIS_TOOL_NAME,
              args: {
                summary:
                  'Senior backend engineer with NestJS/PostgreSQL experience.',
                skills: ['nestjs', 'postgresql'],
                experienceYears: 5,
                education: ['B.S. Computer Science'],
              },
              id: 'call-extract-1',
              type: 'tool_call',
            },
          ],
        }),
    }),
  } as unknown as BaseChatModel;

  /**
   * The matching agent is a real LangGraph tool-call loop (see
   * RecruitmentAgent) — this fake plays two rounds: call search_candidates
   * first, then read back its *real* result (a genuine DB row, since
   * search_candidates itself is never mocked) to submit a match using the
   * actual candidateId Postgres generated, not a hardcoded one.
   */
  function makeMatchingChatModelMock(): BaseChatModel {
    let call = 0;
    const invoke = jest.fn(async (messages: BaseMessage[]) => {
      call += 1;
      if (call === 1) {
        return new AIMessage({
          content: '',
          tool_calls: [
            {
              name: 'search_candidates',
              args: {},
              id: 'call-search-1',
              type: 'tool_call',
            },
          ],
        });
      }

      const toolMessage = [...messages]
        .reverse()
        .find((m): m is ToolMessage => m instanceof ToolMessage);
      const rows: { candidateId?: string }[] = toolMessage
        ? JSON.parse(toolMessage.content as string)
        : [];
      const candidateId = rows[0]?.candidateId;

      return new AIMessage({
        content: '',
        tool_calls: [
          {
            name: SUBMIT_MATCHING_RESULT_TOOL_NAME,
            args: {
              matches: candidateId
                ? [
                    {
                      candidateId,
                      score: 90,
                      matchedSkills: ['nestjs'],
                      missingSkills: [],
                      reason: 'Strong backend fit for this role.',
                    },
                  ]
                : [],
            },
            id: 'call-submit-1',
            type: 'tool_call',
          },
        ],
      });
    });
    return { bindTools: () => ({ invoke }) } as unknown as BaseChatModel;
  }

  const cvTextExtractorMock: Pick<CvTextExtractor, 'extractText'> = {
    extractText: jest
      .fn()
      .mockResolvedValue(
        'Jane Candidate - Senior Backend Engineer - 5 years NestJS and PostgreSQL experience',
      ),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(IMailService)
      .useValue(mailServiceMock)
      .overrideProvider(CV_ANALYSIS_CHAT_MODEL)
      .useValue(cvAnalysisChatModelMock)
      .overrideProvider(MATCHING_CHAT_MODEL)
      .useValue(makeMatchingChatModelMock())
      .overrideProvider(CvTextExtractor)
      .useValue(cvTextExtractorMock)
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
    cvAnalysisRepository = app.get(ICvAnalysisRepository);
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

  /** A job can't be posted without an owning company (JOB_COMPANY_PROFILE_REQUIRED) — same order app.e2e-spec.ts uses. */
  async function createCompany(
    recruiterToken: string,
    name: string,
  ): Promise<string> {
    const res = await request(app.getHttpServer())
      .post('/api/v1/companies')
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({ name })
      .expect(201);
    return res.body.data.id;
  }

  /**
   * Only needs to pass FileUploadDomainService.validateFileSignature's
   * magic-byte check (see app.e2e-spec.ts's own CV upload test, which uses
   * the same fixture) — CvTextExtractor is overridden above, so unlike an
   * earlier version of this test, nothing here needs to be a genuinely
   * parseable PDF.
   */
  const FAKE_PDF_BYTES = Buffer.from('%PDF-1.4 fake e2e cv content');

  /** Polls the real repository (not an endpoint) — there is no HTTP-level way to check analysis status. */
  async function waitForCompletedAnalysis(
    cvId: string,
    timeoutMs = 10_000,
  ): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const analysis = await cvAnalysisRepository.findByCvId(cvId);
      if (analysis?.status === CvAnalysisStatus.COMPLETED) return;
      if (analysis?.status === CvAnalysisStatus.FAILED) {
        throw new Error(
          `CV analysis failed instead of completing: ${analysis.failureReason}`,
        );
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error(
      `CV analysis for ${cvId} did not reach COMPLETED within ${timeoutMs}ms`,
    );
  }

  // Default 5000ms is too tight for this test's real work: two bcrypt-based
  // register/login pairs, a company+job+CV+application round trip, the
  // waitForCompletedAnalysis poll (up to 10s on its own), and the matching
  // call — same rationale as the existing bump on other heavy e2e setups
  // (jobs-applications.e2e-spec.ts, chat.e2e-spec.ts).
  it('finds the real, newly-analyzed candidate through the full upload -> analyze -> match path', async () => {
    const runId = Date.now();
    const recruiterEmail = `ai-recruiter-${runId}@e2e.test`;
    const candidateEmail = `ai-candidate-${runId}@e2e.test`;

    const recruiterToken = await registerAndLogin(recruiterEmail, 'RECRUITER');
    const candidateToken = await registerAndLogin(candidateEmail, 'CANDIDATE');
    await createCompany(recruiterToken, `AI E2E Corp ${runId}`);

    const jobRes = await request(app.getHttpServer())
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({
        title: 'AI E2E Backend Developer',
        description: 'Build APIs with NestJS and PostgreSQL',
        location: 'Remote',
      })
      .expect(201);
    const jobId = jobRes.body.data.id;

    const cvRes = await request(app.getHttpServer())
      .post('/api/v1/cvs')
      .set('Authorization', `Bearer ${candidateToken}`)
      .field('title', 'AI E2E Candidate CV')
      .attach('file', FAKE_PDF_BYTES, {
        filename: 'ai-e2e-cv.pdf',
        contentType: 'application/pdf',
      })
      .expect(201);
    const cvId = cvRes.body.data.id;

    // F6 (code review): AI candidate discovery is scoped to a job's actual
    // applicant pool — the candidate must apply before search_candidates
    // can ever surface them, not just have a completed analysis.
    const applyRes = await request(app.getHttpServer())
      .post('/api/v1/job-applications')
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({ jobId, cvId, coverLetter: 'Please consider me' })
      .expect(201);
    const candidateUserId = applyRes.body.data.userId;

    await waitForCompletedAnalysis(cvId);

    const matchRes = await request(app.getHttpServer())
      .post(`/api/v1/jobs/${jobId}/matching-candidates`)
      .set('Authorization', `Bearer ${recruiterToken}`)
      .expect(201);

    expect(matchRes.body.data.jobId).toBe(jobId);
    expect(matchRes.body.data.matches).toEqual([
      expect.objectContaining({
        candidateId: candidateUserId,
        score: 90,
        matchedSkills: ['nestjs'],
      }),
    ]);
  }, 30_000);

  // Same timeout rationale as above — three bcrypt-based register/login
  // pairs this time, not two.
  it('never surfaces a real, analyzed candidate who has not applied to this job', async () => {
    const runId = Date.now();
    const recruiterEmail = `ai-recruiter-unapplied-${runId}@e2e.test`;
    const otherRecruiterEmail = `ai-recruiter-other-${runId}@e2e.test`;
    const candidateEmail = `ai-candidate-unapplied-${runId}@e2e.test`;

    const recruiterToken = await registerAndLogin(recruiterEmail, 'RECRUITER');
    const otherRecruiterToken = await registerAndLogin(
      otherRecruiterEmail,
      'RECRUITER',
    );
    const candidateToken = await registerAndLogin(candidateEmail, 'CANDIDATE');
    await createCompany(recruiterToken, `AI E2E Corp ${runId}`);
    await createCompany(otherRecruiterToken, `AI E2E Other Corp ${runId}`);

    // The candidate applies to otherRecruiter's job, analysis completes —
    // but recruiter's own job (checked below) has zero applicants.
    const otherJobRes = await request(app.getHttpServer())
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${otherRecruiterToken}`)
      .send({
        title: 'AI E2E Other Job',
        description: 'A different job the candidate actually applies to',
        location: 'Remote',
      })
      .expect(201);
    const otherJobId = otherJobRes.body.data.id;

    const jobRes = await request(app.getHttpServer())
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({
        title: 'AI E2E Job With No Applicants',
        description: 'No one has applied to this one',
        location: 'Remote',
      })
      .expect(201);
    const jobId = jobRes.body.data.id;

    const cvRes = await request(app.getHttpServer())
      .post('/api/v1/cvs')
      .set('Authorization', `Bearer ${candidateToken}`)
      .field('title', 'AI E2E Unapplied Candidate CV')
      .attach('file', FAKE_PDF_BYTES, {
        filename: 'ai-e2e-unapplied-cv.pdf',
        contentType: 'application/pdf',
      })
      .expect(201);
    const cvId = cvRes.body.data.id;

    await request(app.getHttpServer())
      .post('/api/v1/job-applications')
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({
        jobId: otherJobId,
        cvId,
        coverLetter: 'Consider me for the other job',
      })
      .expect(201);

    await waitForCompletedAnalysis(cvId);

    const matchRes = await request(app.getHttpServer())
      .post(`/api/v1/jobs/${jobId}/matching-candidates`)
      .set('Authorization', `Bearer ${recruiterToken}`)
      .expect(201);

    expect(matchRes.body.data.matches).toEqual([]);
  }, 30_000);
});
