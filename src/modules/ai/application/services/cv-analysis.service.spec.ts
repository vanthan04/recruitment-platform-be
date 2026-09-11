import { ConfigService } from '@nestjs/config';
import { AIMessage } from '@langchain/core/messages';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { CvAnalysisService } from '@/modules/ai/application/services/cv-analysis.service';
import { ICvAnalysisRepository } from '@/modules/ai/domain/repositories/cv-analysis.repository';
import { CvAnalysisStatus } from '@/modules/ai/domain/value-objects/cv-analysis-status.vo';
import { ICvStoragePort } from '@/modules/cv/application/ports/cv-storage.port';
import { CvTextExtractor } from '@/modules/ai/infrastructure/text-extraction/cv-text-extractor';
import { EXTRACT_CV_ANALYSIS_TOOL_NAME } from '@/modules/ai/schemas/cv-analysis-extraction.schema';

const FILE_INFO = {
  cvId: 'cv-1',
  userId: 'user-1',
  fileKey: 'cvs/user-1/2026/09/cv-1.pdf',
  mimeType: 'application/pdf',
  fileType: 'PDF',
};

function makeFakeModel(response: AIMessage): BaseChatModel {
  const invoke = jest.fn().mockResolvedValue(response);
  return { bindTools: () => ({ invoke }) } as unknown as BaseChatModel;
}

function makeService(chatModel: BaseChatModel) {
  const cvAnalysisRepository: jest.Mocked<ICvAnalysisRepository> = {
    findByCvId: jest.fn().mockResolvedValue(null),
    save: jest.fn().mockImplementation(async (a) => a),
    findPendingCvIds: jest.fn(),
    searchCandidatePool: jest.fn(),
    findCandidateByUserId: jest.fn(),
    findCvFileInfo: jest.fn().mockResolvedValue(FILE_INFO),
  };
  const cvStorage: jest.Mocked<Pick<ICvStoragePort, 'downloadBuffer'>> = {
    downloadBuffer: jest.fn().mockResolvedValue(Buffer.from('%PDF-fake')),
  };
  const textExtractor: jest.Mocked<Pick<CvTextExtractor, 'extractText'>> = {
    extractText: jest
      .fn()
      .mockResolvedValue(
        'Jane Doe. 3 years experience with NestJS and PostgreSQL.',
      ),
  };
  const configService = {
    get: jest.fn((key: string, fallback?: unknown) => fallback),
  };

  const service = new CvAnalysisService(
    cvAnalysisRepository,
    cvStorage as unknown as ICvStoragePort,
    textExtractor as unknown as CvTextExtractor,
    configService as unknown as ConfigService,
    chatModel,
  );

  return { service, cvAnalysisRepository, cvStorage, textExtractor };
}

describe('CvAnalysisService', () => {
  it('persists a COMPLETED analysis on a successful extraction', async () => {
    const model = makeFakeModel(
      new AIMessage({
        content: '',
        tool_calls: [
          {
            name: EXTRACT_CV_ANALYSIS_TOOL_NAME,
            args: {
              summary: 'Backend engineer with NestJS experience.',
              skills: ['NestJS', 'PostgreSQL'],
              experienceYears: 3,
              education: [],
            },
            id: 'call-1',
            type: 'tool_call',
          },
        ],
      }),
    );
    const { service, cvAnalysisRepository } = makeService(model);

    await service.analyzeCv('cv-1');

    expect(cvAnalysisRepository.save).toHaveBeenCalledTimes(1);
    const saved = cvAnalysisRepository.save.mock.calls[0][0];
    expect(saved.status).toBe(CvAnalysisStatus.COMPLETED);
    expect(saved.skills).toEqual(['nestjs', 'postgresql']);
    expect(saved.experienceYears).toBe(3);
  });

  it('skips without saving when the CV has no file info (deleted/missing)', async () => {
    const model = makeFakeModel(new AIMessage({ content: '' }));
    const { service, cvAnalysisRepository } = makeService(model);
    cvAnalysisRepository.findCvFileInfo.mockResolvedValue(null);

    await service.analyzeCv('cv-missing');

    expect(cvAnalysisRepository.save).not.toHaveBeenCalled();
  });

  it('persists a FAILED analysis (never throws) when the model does not call the extraction tool', async () => {
    const model = makeFakeModel(new AIMessage({ content: 'no tool call' }));
    const { service, cvAnalysisRepository } = makeService(model);

    await expect(service.analyzeCv('cv-1')).resolves.toBeUndefined();

    expect(cvAnalysisRepository.save).toHaveBeenCalledTimes(1);
    const saved = cvAnalysisRepository.save.mock.calls[0][0];
    expect(saved.status).toBe(CvAnalysisStatus.FAILED);
    expect(saved.failureReason).toContain('extract_cv_analysis');
  });

  it('persists a FAILED analysis (never throws) when text extraction fails', async () => {
    const model = makeFakeModel(new AIMessage({ content: '' }));
    const { service, cvAnalysisRepository, textExtractor } = makeService(model);
    textExtractor.extractText.mockRejectedValue(
      new Error('No extractable text found in CV file'),
    );

    await expect(service.analyzeCv('cv-1')).resolves.toBeUndefined();

    expect(cvAnalysisRepository.save).toHaveBeenCalledTimes(1);
    const saved = cvAnalysisRepository.save.mock.calls[0][0];
    expect(saved.status).toBe(CvAnalysisStatus.FAILED);
    expect(saved.failureReason).toContain('No extractable text');
  });
});
