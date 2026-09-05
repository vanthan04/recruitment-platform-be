export const USER_SESSION_REVOKED_EVENT = 'user.session_revoked';

/**
 * Fired whenever a user's sessions are forcibly ended — logout, logout-all,
 * or an admin blocking the account — so anything holding a long-lived
 * connection tied to that session (the chat WebSocket gateway, currently)
 * can drop it immediately instead of only via the auth-check on its next
 * REST call, which a standing WS connection never makes.
 */
export class UserSessionRevokedEvent {
  constructor(public readonly userId: string) {}
}
