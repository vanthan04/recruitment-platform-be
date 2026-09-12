import { AIMessage } from '@langchain/core/messages';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { QueryBus } from '@nestjs/cqrs';
import { RecruitmentAgent } from '@/modules/ai/agents/recruitment.agent';
import { MatchingToolRegistry } from '@/modules/ai/tools/matching-tool-registry';
import { ICvAnalysisRepository } from '@/modules/ai/domain/repositories/cv-analysis.repository';
import {
  AiProviderException,
  InvalidAiOutputException,
} from '@/modules/ai/domain/exceptions/ai.exceptions';
import { SUBMIT_MATCHING_RESULT_TOOL_NAME } from '@/modules/ai/schemas/matching-result.schema';

/**
 * A fake BaseChatModel: `bindTools()` returns a runnable whose `.invoke()`
 * replays canned responses, one per agent-node visit. Each call returns a
 * freshly-constructed AIMessage (distinct identity/id) — LangGraph's
 * messages reducer upserts by message id, so replaying the same object
 * instance would collapse into one history entry instead of a growing
 * conversation, unlike a real model's responses.
 */
function makeFakeModel(
  responses: { content: string; toolCalls: AIMessage['tool_calls'] }[],
): BaseChatModel {
  let call = 0;
  const invoke = jest.fn(async () => {
    const response = responses[Math.min(call, responses.length - 1)];
    call += 1;
    return new AIMessage({
      content: response.content,
      tool_calls: response.toolCalls,
    });
  });
  return { bindTools: () => ({ invoke }) } as unknown as BaseChatModel;
}

function makeToolRegistry(): MatchingToolRegistry {
  const queryBus = { execute: jest.fn() } as unknown as QueryBus;
  const cvAnalysisRepository: jest.Mocked<ICvAnalysisRepository> = {
    findByCvId: jest.fn(),
    save: jest.fn(),
    findPendingCvIds: jest.fn(),
    searchCandidatePool: jest
      .fn()
      .mockResolvedValue([{ candidateId: 'cand-1' }]),
    findCandidateByUserId: jest.fn(),
    findCvFileInfo: jest.fn(),
  };
  return new MatchingToolRegistry({
    queryBus,
    cvAnalysisRepository,
    recruiterId: 'recruiter-1',
    jobId: 'job-1',
    maxCandidates: 30,
  });
}

function toolCallResponse(
  name: string,
  args: Record<string, unknown>,
  id = `call-${name}`,
) {
  return {
    content: '',
    toolCalls: [{ name, args, id, type: 'tool_call' as const }],
  };
}

function textResponse(content: string) {
  return { content, toolCalls: [] };
}

const VALID_MATCH = {
  candidateId: 'cand-1',
  score: 90,
  matchedSkills: ['NestJS'],
  missingSkills: [],
  reason: 'Great fit.',
};

describe('RecruitmentAgent', () => {
  it('runs a tool call through the graph, feeds the result back, and returns the validated submission', async () => {
    const model = makeFakeModel([
      toolCallResponse('search_candidates', {}),
      toolCallResponse(SUBMIT_MATCHING_RESULT_TOOL_NAME, {
        matches: [VALID_MATCH],
      }),
    ]);
    const agent = new RecruitmentAgent(model);

    const result = await agent.run(makeToolRegistry(), 30);

    expect(result.matches).toEqual([VALID_MATCH]);
  });

  it('does not crash when the model calls a tool outside the registry, and can still recover and submit', async () => {
    const model = makeFakeModel([
      toolCallResponse('delete_everything', {}),
      toolCallResponse(SUBMIT_MATCHING_RESULT_TOOL_NAME, { matches: [] }),
    ]);
    const agent = new RecruitmentAgent(model);

    const result = await agent.run(makeToolRegistry(), 30);

    expect(result.matches).toEqual([]);
  });

  it('rejects a submission that fails schema validation', async () => {
    const model = makeFakeModel([
      toolCallResponse(SUBMIT_MATCHING_RESULT_TOOL_NAME, {
        matches: [{ candidateId: 'cand-1', score: 999 }],
      }),
    ]);
    const agent = new RecruitmentAgent(model);

    await expect(agent.run(makeToolRegistry(), 30)).rejects.toThrow(
      InvalidAiOutputException,
    );
  });

  it('drops a candidateId that was never returned by a tool in this run', async () => {
    const model = makeFakeModel([
      toolCallResponse('search_candidates', {}),
      toolCallResponse(SUBMIT_MATCHING_RESULT_TOOL_NAME, {
        matches: [
          VALID_MATCH,
          { ...VALID_MATCH, candidateId: 'fabricated-id' },
        ],
      }),
    ]);
    const agent = new RecruitmentAgent(model);

    const result = await agent.run(makeToolRegistry(), 30);

    expect(result.matches).toHaveLength(1);
    expect(result.matches[0].candidateId).toBe('cand-1');
  });

  it('throws InvalidAiOutputException if the model ends its turn without submitting', async () => {
    const model = makeFakeModel([textResponse('no comment')]);
    const agent = new RecruitmentAgent(model);

    await expect(agent.run(makeToolRegistry(), 30)).rejects.toThrow(
      InvalidAiOutputException,
    );
  });

  it('throws AiProviderException after exceeding the tool-call round budget', async () => {
    const model = makeFakeModel([toolCallResponse('search_candidates', {})]);
    const agent = new RecruitmentAgent(model);

    await expect(agent.run(makeToolRegistry(), 30)).rejects.toThrow(
      AiProviderException,
    );
  });
});
