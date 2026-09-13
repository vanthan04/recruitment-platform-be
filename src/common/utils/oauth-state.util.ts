import { randomBytes, timingSafeEqual } from 'crypto';
import { CookieOptions } from 'express';

/**
 * CSRF protection for the OAuth login flow (Google/Facebook). Both guards
 * run with `session: false` (JWT-based app, no server session to hang
 * Passport's own `state` verification off), so this app manages its own
 * nonce instead — without it, an attacker can start their own OAuth flow,
 * capture the resulting `code`/`state`, and get a victim's browser to open
 * the callback URL, silently logging the victim into the attacker's account
 * (login CSRF).
 *
 * Flow: the initiation route (GoogleAuthGuard/FacebookAuthGuard.canActivate)
 * mints a random nonce, stores it in a short-lived cookie, and sends it to
 * the provider as (part of) `state`. The callback route
 * (AuthController.handleSocialCallback) reads the same cookie back and
 * verifies it matches the `state` the provider echoed — before ever calling
 * `authService.socialLogin()`.
 */
export const OAUTH_STATE_COOKIE = 'oauth_csrf_state';
const OAUTH_STATE_MAX_AGE_MS = 10 * 60 * 1000; // long enough for a consent screen, short enough to limit replay
// Scoped to /auth so the cookie doesn't ride along on unrelated requests —
// covers both /auth/google(|/callback) and /auth/facebook(|/callback).
const OAUTH_STATE_COOKIE_PATH = '/api/v1/auth';

export function oauthStateCookieOptions(isProduction: boolean): CookieOptions {
  return {
    httpOnly: true,
    secure: isProduction,
    // Lax, not Strict: the callback arrives as a top-level GET navigation
    // FROM the provider's domain (google.com/facebook.com) — Lax is exactly
    // the tier that still sends the cookie on that cross-site navigation;
    // Strict would drop it and break the flow for every user.
    sameSite: 'lax',
    maxAge: OAUTH_STATE_MAX_AGE_MS,
    path: OAUTH_STATE_COOKIE_PATH,
  };
}

/** `state` sent to the provider — the nonce, plus the requested role if any. */
export function buildOAuthState(nonce: string, role?: string): string {
  return role ? `${nonce}.${role}` : nonce;
}

export function parseOAuthState(
  state: string | undefined,
): { nonce: string; role?: string } | null {
  if (!state) return null;
  const [nonce, role] = state.split('.');
  if (!nonce) return null;
  return { nonce, role: role || undefined };
}

export function generateOAuthNonce(): string {
  return randomBytes(24).toString('hex');
}

/** Constant-time comparison — this is a CSRF token, not a public value. */
export function isValidOAuthNonce(
  cookieNonce: string | null,
  stateNonce: string | undefined,
): boolean {
  if (!cookieNonce || !stateNonce) return false;
  const a = Buffer.from(cookieNonce);
  const b = Buffer.from(stateNonce);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
