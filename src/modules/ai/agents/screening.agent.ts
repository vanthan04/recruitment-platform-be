import { Inject, Injectable, Logger } from '@nestjs/common';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  SystemMessage,
} from '@langchain/core/messages';
import {
  StateGraph,
  MessagesAnnotation,
  START,
  END,
  GraphRecursionError,
} from '@langchain/langgraph';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { SCREENING_CHAT_MODEL } from '@/modules/ai/infrastructure/providers/chat-model.provider';
import { translateProviderError } from '@/modules/ai/infrastructure/providers/provider-error.util';
import { ScreeningToolRegistry } from '@/modules/ai/tools/screening-tool-registry';
import { buildScreeningSystemPrompt } from '@/modules/ai/prompts/screening.prompt';
import {
  AiProviderException,
  InvalidAiOutputException,
} from '@/modules/ai/domain/exceptions/ai.exceptions';

// A screening question needs far fewer rounds than matching (at most
// get_job + get_candidate + get_cv_analysis, no search/ranking) — kept
// small so a confused model can't loop forever on one HTTP request.
const MAX_TOOL_CALL_ROUNDS = 5;

export interface ScreeningTurn {
  role: 'user' | 'assistant';
  content: string;
}

type GraphState = typeof MessagesAnnotation.State;

/**
 * Second agent sharing RecruitmentAgent's LangGraph shape (one "agent" node
 * <-> one ToolNode) but ending on a plain-text answer instead of a
 * schema-validated submission — a Q&A answer is genuinely prose, there is
 * no structured claim (like a candidateId or score) that needs validating
 * against a known-real set the way matching's result does.
 */
@Injectable()
export class ScreeningAgent {
  private readonly logger = new Logger(ScreeningAgent.name);

  constructor(
    @Inject(SCREENING_CHAT_MODEL) private readonly model: BaseChatModel,
  ) {}

  async ask(
    tools: ScreeningToolRegistry,
    question: string,
    priorTurns: ScreeningTurn[] = [],
  ): Promise<string> {
    const system = buildScreeningSystemPrompt();
    // Non-null: see the same assertion's doc comment in recruitment.agent.ts.
    const modelWithTools = this.model.bindTools!(tools.tools);

    const graph = new StateGraph(MessagesAnnotation)
      .addNode('agent', async (state: GraphState) => {
        const response = await modelWithTools.invoke([
          new SystemMessage(system),
          ...state.messages,
        ]);
        return { messages: [response] };
      })
      .addNode('tools', new ToolNode(tools.tools))
      .addEdge(START, 'agent')
      .addConditionalEdges('agent', (state: GraphState) =>
        this.routeAfterAgent(state.messages),
      )
      .addEdge('tools', 'agent')
      .compile();

    const seedMessages: BaseMessage[] = [
      ...priorTurns.map((turn) =>
        turn.role === 'user'
          ? new HumanMessage(turn.content)
          : new AIMessage(turn.content),
      ),
      new HumanMessage(question),
    ];

    let finalMessages: BaseMessage[];
    try {
      const result = await graph.invoke(
        { messages: seedMessages },
        { recursionLimit: MAX_TOOL_CALL_ROUNDS * 2 + 2 },
      );
      finalMessages = result.messages;
    } catch (error) {
      if (error instanceof GraphRecursionError) {
        this.logger.warn(
          `ScreeningAgent: exceeded ${MAX_TOOL_CALL_ROUNDS} tool-call rounds without an answer`,
        );
        throw new AiProviderException(
          'The AI provider did not produce an answer within the allowed number of tool-call rounds',
        );
      }
      throw translateProviderError(error, this.logger);
    }

    const last = finalMessages[finalMessages.length - 1] as AIMessage;
    const answer = typeof last.content === 'string' ? last.content.trim() : '';
    if (!answer) {
      this.logger.warn('ScreeningAgent: model produced an empty answer');
      throw new InvalidAiOutputException(
        'The AI provider did not produce an answer',
      );
    }

    return answer;
  }

  private routeAfterAgent(messages: BaseMessage[]): 'tools' | typeof END {
    const last = messages[messages.length - 1] as AIMessage;
    return (last.tool_calls?.length ?? 0) > 0 ? 'tools' : END;
  }
}
