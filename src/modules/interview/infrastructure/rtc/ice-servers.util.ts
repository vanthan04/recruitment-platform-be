import { createHmac } from 'crypto';
import { IceServer } from '@/modules/interview/application/ports/interview-room-provider.port';

export interface IceConfig {
  stunUrls: string[];
  turnUrls: string[];
  /** coturn `static-auth-secret` (use-auth-secret mode). TURN is offered only when this and turnUrls are set. */
  turnSecret?: string;
  ttlSeconds: number;
}

/** "a, b,,c" -> ["a","b","c"]; undefined/blank -> []. */
export function parseUrlList(value: string | undefined | null): string[] {
  return (value ?? '')
    .split(',')
    .map((u) => u.trim())
    .filter(Boolean);
}

/**
 * ICE servers for one participant. STUN is public and unauthenticated. TURN
 * uses the time-limited credential scheme of coturn's REST API / TURN REST
 * draft: username = "<expiryUnixSeconds>:<userId>", credential =
 * base64(HMAC-SHA1(secret, username)). The shared secret never leaves the
 * server and each credential stops working after `ttlSeconds`.
 */
export function buildIceServers(
  config: IceConfig,
  userId: string,
  nowMs: number = Date.now(),
): IceServer[] {
  const servers: IceServer[] = [];
  if (config.stunUrls.length > 0) servers.push({ urls: config.stunUrls });

  if (config.turnUrls.length > 0 && config.turnSecret) {
    const expiry = Math.floor(nowMs / 1000) + config.ttlSeconds;
    const username = `${expiry}:${userId}`;
    const credential = createHmac('sha1', config.turnSecret)
      .update(username)
      .digest('base64');
    servers.push({ urls: config.turnUrls, username, credential });
  }
  return servers;
}
