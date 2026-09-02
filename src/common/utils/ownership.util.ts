import { UnauthorizedDomainException } from '@/common/exceptions/domain.exception';

/**
 * Shared "is the requester the owner" check for cross-module handlers that
 * only have a lookup-port DTO (not the real domain entity) to compare against.
 */
export const ensureOwner = (
  ownerId: string,
  requesterId: string,
  message?: string,
): void => {
  if (ownerId !== requesterId) {
    throw new UnauthorizedDomainException(message);
  }
};
