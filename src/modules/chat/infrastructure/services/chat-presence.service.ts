import { Injectable } from '@nestjs/common';

/**
 * In-memory, single-instance presence tracking (userId -> connected socket
 * ids). Sufficient for this app's current single-process deployment — see
 * CHAT_INTEGRATION_PLAN.md §6 for the documented Redis upgrade path if this
 * ever runs across multiple instances.
 */
@Injectable()
export class ChatPresenceService {
  private readonly socketsByUser = new Map<string, Set<string>>();

  /** Returns true if this socket just brought the user online (was fully offline before). */
  addSocket(userId: string, socketId: string): boolean {
    const sockets = this.socketsByUser.get(userId) ?? new Set<string>();
    const wasOffline = sockets.size === 0;
    sockets.add(socketId);
    this.socketsByUser.set(userId, sockets);
    return wasOffline;
  }

  /** Returns true if this was the user's last socket (they just went offline). */
  removeSocket(userId: string, socketId: string): boolean {
    const sockets = this.socketsByUser.get(userId);
    if (!sockets) return false;
    sockets.delete(socketId);
    if (sockets.size === 0) {
      this.socketsByUser.delete(userId);
      return true;
    }
    return false;
  }

  isOnline(userId: string): boolean {
    return (this.socketsByUser.get(userId)?.size ?? 0) > 0;
  }
}
