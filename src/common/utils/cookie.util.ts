/**
 * Minimal cookie-header parser — avoids pulling in a cookie-parsing
 * dependency for the handful of fields this app reads outside of
 * `res.cookie()`/`res.clearCookie()` (which need no parsing to set).
 * Shared by the chat gateway's WS handshake auth and the OAuth CSRF-state
 * check — see ws-auth.util.ts and google/facebook-auth.guard.ts.
 */
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
