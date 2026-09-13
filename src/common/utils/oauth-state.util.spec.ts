import {
  buildOAuthState,
  generateOAuthNonce,
  isValidOAuthNonce,
  oauthStateCookieOptions,
  parseOAuthState,
} from '@/common/utils/oauth-state.util';

describe('oauth-state.util', () => {
  describe('generateOAuthNonce', () => {
    it('generates a non-empty, sufficiently long random value each time', () => {
      const a = generateOAuthNonce();
      const b = generateOAuthNonce();
      expect(a).not.toEqual(b);
      expect(a.length).toBeGreaterThanOrEqual(32);
    });
  });

  describe('buildOAuthState / parseOAuthState', () => {
    it('round-trips a nonce with no role', () => {
      const state = buildOAuthState('abc123');
      expect(parseOAuthState(state)).toEqual({
        nonce: 'abc123',
        role: undefined,
      });
    });

    it('round-trips a nonce with a role', () => {
      const state = buildOAuthState('abc123', 'RECRUITER');
      expect(parseOAuthState(state)).toEqual({
        nonce: 'abc123',
        role: 'RECRUITER',
      });
    });

    it('returns null for an undefined or empty state', () => {
      expect(parseOAuthState(undefined)).toBeNull();
      expect(parseOAuthState('')).toBeNull();
    });
  });

  describe('isValidOAuthNonce', () => {
    it('accepts a matching nonce', () => {
      expect(isValidOAuthNonce('abc123', 'abc123')).toBe(true);
    });

    it('rejects a mismatched nonce (the actual CSRF defense)', () => {
      expect(isValidOAuthNonce('abc123', 'someone-elses-nonce')).toBe(false);
    });

    it('rejects when either side is missing', () => {
      expect(isValidOAuthNonce(null, 'abc123')).toBe(false);
      expect(isValidOAuthNonce('abc123', undefined)).toBe(false);
      expect(isValidOAuthNonce(null, undefined)).toBe(false);
    });
  });

  describe('oauthStateCookieOptions', () => {
    it('is httpOnly, Lax, and scoped to /api/v1/auth regardless of environment', () => {
      expect(oauthStateCookieOptions(false)).toMatchObject({
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/api/v1/auth',
      });
      expect(oauthStateCookieOptions(true)).toMatchObject({
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/api/v1/auth',
      });
    });
  });
});
