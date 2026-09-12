import { QueryBus } from '@nestjs/cqrs';
import { AIMessage } from '@langchain/core/messages';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { SkillSuggestionService } from '@/modules/ai/application/services/skill-suggestion.service';
import { InvalidAiOutputException } from '@/modules/ai/domain/exceptions/ai.exceptions';
import { SUBMIT_SKILL_SUGGESTIONS_TOOL_NAME } from '@/modules/ai/schemas/skill-suggestion.schema';

const TAXONOMY = [
  { id: 'skill-1', name: 'NestJS', slug: 'nestjs' },
  { id: 'skill-2', name: 'PostgreSQL', slug: 'postgresql' },
  { id: 'skill-3', name: 'Docker', slug: 'docker' },
];

function makeFakeModel(response: AIMessage): BaseChatModel {
  const invoke = jest.fn().mockResolvedValue(response);
  return { bindTools: () => ({ invoke }) } as unknown as BaseChatModel;
}

function makeService(chatModel: BaseChatModel, taxonomy = TAXONOMY) {
  const queryBus = { execute: jest.fn().mockResolvedValue(taxonomy) };
  const service = new SkillSuggestionService(
    queryBus as unknown as QueryBus,
    chatModel,
  );
  return { service, queryBus };
}

function toolCallMessage(skillIds: string[]) {
  return new AIMessage({
    content: '',
    tool_calls: [
      {
        name: SUBMIT_SKILL_SUGGESTIONS_TOOL_NAME,
        args: { skillIds },
        id: 'call-1',
        type: 'tool_call',
      },
    ],
  });
}

describe('SkillSuggestionService', () => {
  it('returns matching skills from the real taxonomy', async () => {
    const model = makeFakeModel(toolCallMessage(['skill-1', 'skill-2']));
    const { service } = makeService(model);

    const result = await service.suggestSkills(
      'Backend Dev',
      'NestJS + PostgreSQL role',
    );

    expect(result).toEqual([TAXONOMY[0], TAXONOMY[1]]);
  });

  it('drops any suggested id that is not in the real taxonomy', async () => {
    const model = makeFakeModel(toolCallMessage(['skill-1', 'fabricated-id']));
    const { service } = makeService(model);

    const result = await service.suggestSkills(undefined, 'NestJS role');

    expect(result).toEqual([TAXONOMY[0]]);
  });

  it('returns an empty array without calling the model when the taxonomy is empty', async () => {
    const model = makeFakeModel(toolCallMessage([]));
    const { service } = makeService(model, []);

    const result = await service.suggestSkills(undefined, 'Some role');

    expect(result).toEqual([]);
  });

  it('throws InvalidAiOutputException when the model does not submit suggestions', async () => {
    const model = makeFakeModel(new AIMessage({ content: 'no tool call' }));
    const { service } = makeService(model);

    await expect(service.suggestSkills(undefined, 'Some role')).rejects.toThrow(
      InvalidAiOutputException,
    );
  });
});
