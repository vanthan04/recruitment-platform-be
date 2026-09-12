import { AIMessage } from '@langchain/core/messages';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { QueryBus } from '@nestjs/cqrs';
import { ScreeningAgent } from '@/modules/ai/agents/screening.agent';
import { ScreeningToolRegistry } from '@/modules/ai/tools/screening-tool-registry';
import { ICvAnalysisRepository } from '@/modules/ai/domain/repositories/cv-analysis.repository';
import {
  AiProviderException,
  InvalidAiOutputException,
} from '@/modules/ai/domain/exceptions/ai.exceptions';

function makeFakeModel(
  responses: { content: string; toolCalls?: AIMessage['tool_calls'] }[],
): BaseChatModel {
  let call = 0;
  const invoke = jest.fn(async () => {
    const response = responses[Math.min(call, responses.length - 1)];
    call += 1;
    return new AIMessage({
      content: response.content,
      tool_calls: response.toolCalls ?? [],
    });
  });
  return { bindTools: () => ({ invoke }) } as unknown as BaseChatModel;
}

function makeToolRegistry(): ScreeningToolRegistry {
  const queryBus = {
    execute: jest.fn().mockResolvedValue({ id: 'job-1' }),
  } as unknown as QueryBus;
  const cvAnalysisRepository: jest.Mocked<ICvAnalysisRepository> = {
    findByCvId: jest.fn(),
    save: jest.fn(),
    findPendingCvIds: jest.fn(),
    searchCandidatePool: jest.fn(),
    findCandidateByUserId: jest
      .fn()
      .mockResolvedValue({ candidateId: 'cand-1' }),
    findCvFileInfo: jest.fn(),
  };
  return new ScreeningToolRegistry({
    queryBus,
    cvAnalysisRepository,
    recruiterId: 'recruiter-1',
    jobId: 'job-1',
    candidateId: 'cand-1',
    maxCandidates: 1,
  });
}

describe('ScreeningAgent', () => {
  it('calls a tool then answers with plain text', async () => {
    const model = makeFakeModel([
      {
        content: '',
        toolCalls: [
          { name: 'get_candidate', args: {}, id: 'call-1', type: 'tool_call' },
        ],
      },
      { content: 'Yes, the candidate has 3 years of NestJS experience.' },
    ]);
    const agent = new ScreeningAgent(model);

    const answer = await agent.ask(
      makeToolRegistry(),
      'Does this candidate know NestJS?',
    );

    expect(answer).toBe('Yes, the candidate has 3 years of NestJS experience.');
  });

  it('answers directly without any tool call when the question needs none', async () => {
    const model = makeFakeModel([
      { content: 'I need to look up the candidate first — let me check.' },
    ]);
    const agent = new ScreeningAgent(model);

    const answer = await agent.ask(makeToolRegistry(), 'Hello?');

    expect(answer).toBe(
      'I need to look up the candidate first — let me check.',
    );
  });

  it('throws InvalidAiOutputException on an empty final answer', async () => {
    const model = makeFakeModel([{ content: '   ' }]);
    const agent = new ScreeningAgent(model);

    await expect(
      agent.ask(makeToolRegistry(), 'Does this candidate know NestJS?'),
    ).rejects.toThrow(InvalidAiOutputException);
  });

  it('throws AiProviderException after exceeding the tool-call round budget', async () => {
    const model = makeFakeModel([
      {
        content: '',
        toolCalls: [
          { name: 'get_candidate', args: {}, id: 'call-1', type: 'tool_call' },
        ],
      },
    ]);
    const agent = new ScreeningAgent(model);

    await expect(
      agent.ask(makeToolRegistry(), 'Does this candidate know NestJS?'),
    ).rejects.toThrow(AiProviderException);
  });
});
