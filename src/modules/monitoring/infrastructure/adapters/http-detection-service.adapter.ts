import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DetectFrameOutcome,
  IDetectionServicePort,
} from '@/modules/monitoring/application/ports/detection-service.port';
import { parseDetectionResponse } from '@/modules/monitoring/infrastructure/adapters/ai-response.util';

/**
 * Calls the Python AI service's POST /detect/frame with the shared service
 * token. Server-to-server only: browsers never see this URL or the token.
 * Never logs frame bytes or the token.
 */
@Injectable()
export class HttpDetectionServiceAdapter implements IDetectionServicePort {
  private readonly logger = new Logger(HttpDetectionServiceAdapter.name);
  private readonly baseUrl: string;
  private readonly token: string;
  private readonly timeoutMs: number;

  constructor(config: ConfigService) {
    this.baseUrl = (config.get<string>('AI_SERVICE_URL') ?? '').replace(
      /\/+$/,
      '',
    );
    this.token = config.get<string>('AI_SERVICE_TOKEN') ?? '';
    this.timeoutMs = config.get<number>('AI_SERVICE_TIMEOUT_MS', 5000);
  }

  isConfigured(): boolean {
    return Boolean(this.baseUrl && this.token);
  }

  async detectFrame(jpeg: Buffer): Promise<DetectFrameOutcome> {
    if (!this.isConfigured()) return { status: 'unavailable' };

    const form = new FormData();
    form.append(
      'file',
      new Blob([new Uint8Array(jpeg)], { type: 'image/jpeg' }),
      'frame.jpg',
    );

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/detect/frame`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.token}` },
        body: form,
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (error) {
      // Timeout or network failure — the frame is simply dropped.
      this.logger.warn(
        `AI service unreachable: ${(error as Error).name}: ${(error as Error).message}`,
      );
      return { status: 'unavailable' };
    }

    const body: unknown = await response.json().catch(() => undefined);

    if (response.ok) {
      const result = parseDetectionResponse(body);
      if (result) return { status: 'ok', result };
      this.logger.error('AI service returned a body outside the contract');
      return { status: 'unavailable' };
    }

    const code = errorCode(body);
    if (response.status === 503 && code === 'AI_BUSY')
      return { status: 'busy' };
    if ([400, 413, 415, 422].includes(response.status)) {
      return { status: 'rejected' };
    }
    if (response.status === 401) {
      // Configuration problem on our side, not a transient one: make it loud.
      this.logger.error('AI service rejected AI_SERVICE_TOKEN (401)');
    } else {
      this.logger.warn(
        `AI service answered ${response.status}${code ? ` ${code}` : ''}`,
      );
    }
    return { status: 'unavailable' };
  }
}

function errorCode(body: unknown): string | undefined {
  if (typeof body !== 'object' || body === null) return undefined;
  const error = (body as { error?: unknown }).error;
  if (typeof error !== 'object' || error === null) return undefined;
  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' ? code : undefined;
}
