/**
 * Provider-agnostic AI abstraction — the agent/tool-call loop is written
 * against this, never against a concrete SDK. Modeled as a stateless
 * "one turn" completion over an explicit message history so a different
 * concrete provider (OpenAI, etc.) can implement it without any change to
 * RecruitmentAgent. See AnthropicAiProvider for the only implementation
 * today (AI_PROVIDER=anthropic).
 */

export interface AiToolDefinition {
  name: string;
  description: string;
  /** JSON Schema (draft 2020-12) object describing this tool's input shape. */
  inputSchema: Record<string, unknown>;
}

export interface AiToolUse {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface AiToolResult {
  toolUseId: string;
  /** JSON-stringified tool output, or a short error description when isError is true. */
  content: string;
  isError?: boolean;
}

export type AiConversationMessage =
  | { role: 'user'; content: string }
  | { role: 'user'; toolResults: AiToolResult[] }
  | { role: 'assistant'; content: string; toolUses: AiToolUse[] };

export interface AiCompletionRequest {
  system: string;
  messages: AiConversationMessage[];
  tools: AiToolDefinition[];
  /** When set, forces the model to call exactly this tool this turn — used for single-shot structured extraction (see CvAnalysisService). */
  forceToolUse?: string;
}

export type AiStopReason = 'tool_use' | 'end_turn' | 'max_tokens' | 'other';

export interface AiCompletionResponse {
  text: string;
  toolUses: AiToolUse[];
  stopReason: AiStopReason;
}

export abstract class IAiProvider {
  abstract complete(
    request: AiCompletionRequest,
  ): Promise<AiCompletionResponse>;
}
