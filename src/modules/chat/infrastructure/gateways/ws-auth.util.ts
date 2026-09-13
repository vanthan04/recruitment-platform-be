import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '@/common/strategies/jwt.strategy';
import { parseCookie } from '@/common/utils/cookie.util';

export interface WsAuthPayload {
  id: string;
  email: string;
  role: string;
}

const ACCESS_TOKEN_COOKIE = 'access_token';

/**
 * Authenticates a Socket.IO handshake using the same httpOnly `access_token`
 * cookie the REST API's `JwtStrategy` validates from the Bearer header — the
 * browser can't read the cookie to set an Authorization header itself, so
 * the gateway reads it directly off the handshake request instead.
 */
export async function authenticateSocket(
  jwtService: JwtService,
  cookieHeader: string | undefined,
): Promise<WsAuthPayload> {
  const token = parseCookie(cookieHeader, ACCESS_TOKEN_COOKIE);
  if (!token) throw new Error('Missing access_token cookie');

  // No explicit `secret` here — `jwtService` already carries the one
  // `JwtModule.registerAsync` configured from `ConfigService` (see chat.module.ts).
  const payload = await jwtService.verifyAsync<JwtPayload>(token);
  return { id: payload.sub, email: payload.email, role: payload.role };
}
