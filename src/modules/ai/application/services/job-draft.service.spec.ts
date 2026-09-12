import { AIMessage } from '@langchain/core/messages';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { JobDraftService } from '@/modules/ai/application/services/job-draft.service';
import { InvalidAiOutputException } from '@/modules/ai/domain/exceptions/ai.exceptions';
import { SUBMIT_JOB_DRAFT_TOOL_NAME } from '@/modules/ai/schemas/job-draft.schema';

function makeFakeModel(response: AIMessage): BaseChatModel {
  const invoke = jest.fn().mockResolvedValue(response);
  return { bindTools: () => ({ invoke }) } as unknown as BaseChatModel;
}

const VALID_DRAFT = {
  title: 'Senior Backend Developer',
  description: 'We are looking for an experienced backend developer...',
  requirements: ['3+ years with NestJS', 'Strong PostgreSQL skills'],
  benefits: ['Remote-friendly', '13th month salary'],
};

describe('JobDraftService', () => {
  it('returns the validated draft on success', async () => {
    const model = makeFakeModel(
      new AIMessage({
        content: '',
        tool_calls: [
          {
            name: SUBMIT_JOB_DRAFT_TOOL_NAME,
            args: VALID_DRAFT,
            id: 'call-1',
            type: 'tool_call',
          },
        ],
      }),
    );
    const service = new JobDraftService(model);

    const draft = await service.draftJob(
      'Senior NestJS dev, HCMC, remote-friendly',
    );

    expect(draft).toEqual(VALID_DRAFT);
  });

  it('throws InvalidAiOutputException when the model does not submit a draft', async () => {
    const model = makeFakeModel(new AIMessage({ content: 'no tool call' }));
    const service = new JobDraftService(model);

    await expect(service.draftJob('some hints')).rejects.toThrow(
      InvalidAiOutputException,
    );
  });

  it('throws InvalidAiOutputException when the submission fails schema validation', async () => {
    const model = makeFakeModel(
      new AIMessage({
        content: '',
        tool_calls: [
          {
            name: SUBMIT_JOB_DRAFT_TOOL_NAME,
            args: { title: 'Missing other fields' },
            id: 'call-1',
            type: 'tool_call',
          },
        ],
      }),
    );
    const service = new JobDraftService(model);

    await expect(service.draftJob('some hints')).rejects.toThrow(
      InvalidAiOutputException,
    );
  });
});
