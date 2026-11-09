import { InterviewViewerRole } from '@/modules/interview/application/dto/interview-detail-response.dto';

export interface IceServer {
  urls: string[];
  username?: string;
  credential?: string;
}

/**
 * What a participant's browser needs to enter the video room. A discriminated
 * union on `provider`: the frontend picks its RoomClient implementation from
 * it. To support a hosted service (LiveKit, Daily, ...), add a member here
 * (e.g. `{ provider: 'livekit'; url: string; token: string }`), an adapter
 * implementing IInterviewRoomProvider, and a matching frontend RoomClient —
 * nothing else in the interview module changes.
 */
export type RoomJoinInfo = { provider: 'p2p'; iceServers: IceServer[] };

export interface RoomParticipantContext {
  interviewId: string;
  userId: string;
  role: InterviewViewerRole;
}

/**
 * Port for the video technology behind an interview room. The caller has
 * already verified the participant, the interview and the open session — the
 * provider only turns that into join credentials.
 */
export abstract class IInterviewRoomProvider {
  abstract issueJoinInfo(ctx: RoomParticipantContext): Promise<RoomJoinInfo>;
}
