/**
 * Emitted once an interview's room can no longer be used: its session was
 * ended, or the interview itself reached COMPLETED / CANCELLED / NO_SHOW (which
 * ends any open session). Emitted by the repositories that persist those
 * changes, so every code path — REST, auto-close — is covered without each
 * command handler having to remember it. The signaling gateway listens and
 * tells whoever is still connected.
 */
export const INTERVIEW_ROOM_CLOSED_EVENT = 'interview.room.closed';

export class InterviewRoomClosedEvent {
  constructor(public readonly interviewId: string) {}
}
