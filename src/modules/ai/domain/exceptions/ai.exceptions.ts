import {
  ExternalServiceException,
  EntityNotFoundException,
} from '@/common/exceptions/domain.exception';

/**
 * `ai`-module domain exceptions. The provider/output-validation ones extend
 * ExternalServiceException (503) — a failure here is never the recruiter's
 * fault, so it must not read as a 400. Never let a raw provider error
 * message or stack trace reach a client (GlobalExceptionFilter already
 * blanks 5xx-and-above bodies, but 503s here are all caught explicitly
 * with a fixed message before they ever get there too — see
 * ai-matching.service.ts).
 */

export class AiProviderException extends ExternalServiceException {
  constructor(message = 'The AI provider request failed') {
    super(message, 'AI_PROVIDER_ERROR');
    this.name = 'AiProviderException';
  }
}

export class AiTimeoutException extends ExternalServiceException {
  constructor(message = 'The AI provider request timed out') {
    super(message, 'AI_PROVIDER_TIMEOUT');
    this.name = 'AiTimeoutException';
  }
}

export class InvalidAiOutputException extends ExternalServiceException {
  constructor(message = 'The AI provider returned an invalid result') {
    super(message, 'AI_INVALID_OUTPUT');
    this.name = 'InvalidAiOutputException';
  }
}

export class AiToolExecutionException extends ExternalServiceException {
  constructor(toolName: string) {
    super(`Tool "${toolName}" failed to execute`, 'AI_TOOL_EXECUTION_ERROR');
    this.name = 'AiToolExecutionException';
  }
}

export class UnregisteredToolException extends ExternalServiceException {
  constructor(toolName: string) {
    super(
      `The AI provider attempted to call an unregistered tool: "${toolName}"`,
      'AI_UNREGISTERED_TOOL',
    );
    this.name = 'UnregisteredToolException';
  }
}

export class CvAnalysisNotFoundException extends EntityNotFoundException {
  constructor(cvId?: string) {
    super('CvAnalysis', cvId, 'CV_ANALYSIS_NOT_FOUND');
    this.name = 'CvAnalysisNotFoundException';
  }
}
