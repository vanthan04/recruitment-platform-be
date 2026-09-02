import { UnauthorizedDomainException } from '@/common/exceptions/domain.exception';

/**
 * Shared "is the requester the owner" check for cross-module handlers that
 * only have a lookup-port DTO (not the real domain entity) to compare against.
 * `code` lets each call site report a specific error code (e.g.
 * `APPLICATION_STATS_ACCESS_DENIED`) instead of the generic
 * `UNAUTHORIZED_ACTION`, without needing a dedicated exception class per
 * one-off authorization check.
 */
export const ensureOwner = (
  ownerId: string,
  requesterId: string,
  message?: string,
  code?: string,
): void => {
  if (ownerId !== requesterId) {
    throw new UnauthorizedDomainException(message, code);
  }
};
