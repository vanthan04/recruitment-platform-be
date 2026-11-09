import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IInterviewRoomProvider,
  RoomJoinInfo,
  RoomParticipantContext,
} from '@/modules/interview/application/ports/interview-room-provider.port';
import {
  buildIceServers,
  parseUrlList,
} from '@/modules/interview/infrastructure/rtc/ice-servers.util';

/**
 * Self-hosted WebRTC: media flows browser-to-browser, signaling goes through
 * InterviewRoomGateway, and this adapter only hands out ICE servers (public
 * STUN, plus TURN with short-lived credentials when TURN_URLS/TURN_SECRET are
 * configured — without TURN, participants behind strict NATs may not connect).
 */
@Injectable()
export class P2pRoomProvider implements IInterviewRoomProvider {
  constructor(private readonly config: ConfigService) {}

  issueJoinInfo(ctx: RoomParticipantContext): Promise<RoomJoinInfo> {
    const iceServers = buildIceServers(
      {
        stunUrls: parseUrlList(this.config.get<string>('STUN_URLS')),
        turnUrls: parseUrlList(this.config.get<string>('TURN_URLS')),
        turnSecret: this.config.get<string>('TURN_SECRET') || undefined,
        ttlSeconds: this.config.get<number>(
          'TURN_CREDENTIAL_TTL_SECONDS',
          3600,
        ),
      },
      ctx.userId,
    );
    return Promise.resolve({ provider: 'p2p', iceServers });
  }
}
