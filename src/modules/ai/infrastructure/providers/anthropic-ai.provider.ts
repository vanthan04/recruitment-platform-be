import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic, {
  APIError,
  APIConnectionTimeoutError,
} from '@anthropic-ai/sdk';
import {
  AiCompletionRequest,
  AiCompletionResponse,
  AiStopReason,
  AiToolUse,
  IAiProvider,
} from '@/modules/ai/infrastructure/providers/ai-provider.interface';
import {
  AiProviderException,
  AiTimeoutException,
} from '@/modules/ai/domain/exceptions/ai.exceptions';

const MAX_RESPONSE_TOKENS = 4096;

/**
 * Concrete IAiProvider for AI_PROVIDER=anthropic. The only place in this
 * module that imports the Anthropic SDK — RecruitmentAgent and every tool
 * depend only on IAiProvider, so swapping providers never touches them.
 */
@Injectable()
export class AnthropicAiProvider implements IAiProvider {
  private readonly logger = new Logger(AnthropicAiProvider.name);
  private readonly client: Anthropic;
  private readonly model: string;
  private readonly temperature: number;

  constructor(private readonly configService: ConfigService) {
    this.model = this.configService.get<string>('AI_MODEL', 'claude-sonnet-5');
    this.temperature = this.configService.get<number>('AI_TEMPERATURE', 0.2);
    this.client = new Anthropic({
      apiKey: this.configService.get<string>('AI_API_KEY'),
      timeout: this.configService.get<number>('AI_REQUEST_TIMEOUT_MS', 30_000),
    });
  }

  async complete(request: AiCompletionRequest): Promise<AiCompletionResponse> {
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: MAX_RESPONSE_TOKENS,
        temperature: this.temperature,
        system: request.system,
        tool_choice: request.forceToolUse
          ? { type: 'tool', name: request.forceToolUse }
          : undefined,
        tools: request.tools.map((tool) => ({
          name: tool.name,
          description: tool.description,
          input_schema: tool.inputSchema as Anthropic.Tool['input_schema'],
        })),
        messages: request.messages.map((message) => {
          if (message.role === 'user' && 'toolResults' in message) {
            return {
              role: 'user' as const,
              content: message.toolResults.map((result) => ({
                type: 'tool_result' as const,
                tool_use_id: result.toolUseId,
                content: result.content,
                is_error: result.isError,
              })),
            };
          }
          if (message.role === 'assistant') {
            const blocks: Anthropic.ContentBlockParam[] = [];
            if (message.content) {
              blocks.push({ type: 'text', text: message.content });
            }
            for (const toolUse of message.toolUses) {
              blocks.push({
                type: 'tool_use',
                id: toolUse.id,
                name: toolUse.name,
                input: toolUse.input,
              });
            }
            return { role: 'assistant' as const, content: blocks };
          }
          return { role: 'user' as const, content: message.content };
        }),
      });

      return this.toCompletionResponse(response);
    } catch (error) {
      if (error instanceof APIConnectionTimeoutError) {
        this.logger.error(`Anthropic request timed out: ${error.message}`);
        throw new AiTimeoutException();
      }
      if (error instanceof APIError) {
        // The real provider error (status, request id, raw body) is logged
        // server-side only — see ai.exceptions.ts's file-level doc comment.
        this.logger.error(
          `Anthropic API error (status ${error.status}): ${error.message}`,
        );
        throw new AiProviderException();
      }
      this.logger.error(
        `Unexpected error calling Anthropic: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new AiProviderException();
    }
  }

  private toCompletionResponse(
    response: Anthropic.Message,
  ): AiCompletionResponse {
    let text = '';
    const toolUses: AiToolUse[] = [];

    for (const block of response.content) {
      if (block.type === 'text') {
        text += block.text;
      } else if (block.type === 'tool_use') {
        toolUses.push({
          id: block.id,
          name: block.name,
          input: (block.input ?? {}) as Record<string, unknown>,
        });
      }
    }

    return {
      text,
      toolUses,
      stopReason: this.toStopReason(response.stop_reason),
    };
  }

  private toStopReason(stopReason: string | null): AiStopReason {
    if (stopReason === 'tool_use') return 'tool_use';
    if (stopReason === 'end_turn') return 'end_turn';
    if (stopReason === 'max_tokens') return 'max_tokens';
    return 'other';
  }
}
