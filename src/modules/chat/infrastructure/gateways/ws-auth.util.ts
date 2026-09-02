import { JwtService } from '@nestjs/jwt';

export interface WsAuthPayload {
  id: string;
  email: string;
  role: string;
}

const ACCESS_TOKEN_COOKIE = 'access_token';

/** Minimal cookie-header parser — avoids pulling in a cookie-parsing dependency for one field. */
export function parseCookie(
  cookieHeader: string | undefined,
  name: string,
): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) {
      return decodeURIComponent(part.slice(eq + 1).trim());
    }
  }
  return null;
}

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

  const payload = await jwtService.verifyAsync(token, {
    secret: process.env.JWT_SECRET,
  });
  return { id: payload.sub, email: payload.email, role: payload.role };
}
