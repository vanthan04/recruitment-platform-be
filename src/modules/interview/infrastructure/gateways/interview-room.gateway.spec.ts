import { JwtService } from '@nestjs/jwt';
import { InterviewRoomGateway, roomName } from './interview-room.gateway';
import {
  IInterviewReadRepository,
  InterviewListItem,
} from '@/modules/interview/domain/repositories/interview-read.repository';
import { IInterviewSessionRepository } from '@/modules/interview/domain/repositories/interview-session.repository';
import { InterviewSchedule } from '@/modules/interview/domain/entities/interview-schedule.entity';
import { InterviewSession } from '@/modules/interview/domain/entities/interview-session.entity';
import { InterviewRoomClosedEvent } from '@/modules/interview/infrastructure/events/interview-room-closed.event';

const INTERVIEW_ID = '11111111-1111-4111-8111-111111111111';

function makeItem(useRoom = true): InterviewListItem {
  return {
    interview: new InterviewSchedule({
      id: INTERVIEW_ID,
      jobApplicationId: 'app-1',
      scheduledAt: new Date(Date.now() + 3600_000),
      useRoom,
      location: useRoom ? undefined : 'Office',
    }),
    jobId: 'job-1',
    jobTitle: 'Backend Developer',
    candidateId: 'candidate-1',
    candidateName: null,
    recruiterId: 'recruiter-1',
    applicationStatus: 'INTERVIEW',
  };
}

// A minimal stand-in for a socket.io server-side socket.
function makeClient(userId: string, id = `sock-${userId}`) {
  const roomEmit = jest.fn();
  const client: any = {
    id,
    data: { userId },
    rooms: new Set<string>(),
    handshake: { headers: {} },
    emit: jest.fn(),
    disconnect: jest.fn(),
    to: jest.fn(() => ({ emit: roomEmit })),
    join: jest.fn((room: string) => {
      client.rooms.add(room);
      return Promise.resolve();
    }),
    leave: jest.fn((room: string) => {
      client.rooms.delete(room);
      return Promise.resolve();
    }),
  };
  return { client, roomEmit };
}

describe('InterviewRoomGateway', () => {
  let readRepository: jest.Mocked<IInterviewReadRepository>;
  let sessionRepository: jest.Mocked<IInterviewSessionRepository>;
  let gateway: InterviewRoomGateway;
  let present: any[];
  let serverEmit: jest.Mock;
  let socketsLeave: jest.Mock;

  beforeEach(() => {
    readRepository = {
      findItemById: jest.fn().mockResolvedValue(makeItem()),
      findForParticipant: jest.fn(),
    };
    sessionRepository = {
      findById: jest.fn(),
      findByInterviewId: jest.fn(),
      findOpenByInterviewId: jest
        .fn()
        .mockResolvedValue(
          new InterviewSession({ id: 'session-1', interviewId: INTERVIEW_ID }),
        ),
      save: jest.fn(),
      update: jest.fn(),
    };
    gateway = new InterviewRoomGateway(
      { verifyAsync: jest.fn() } as unknown as JwtService,
      readRepository,
      sessionRepository,
    );
    present = [];
    serverEmit = jest.fn();
    socketsLeave = jest.fn();
    gateway.server = {
      in: jest.fn(() => ({
        fetchSockets: () => Promise.resolve(present),
        emit: serverEmit,
        socketsLeave,
        disconnectSockets: jest.fn(),
      })),
    } as any;
  });

  const lastError = (client: any) =>
    client.emit.mock.calls.find(([event]: [string]) => event === 'room:error');

  describe('handleConnection', () => {
    it('disconnects a handshake without an access_token cookie', async () => {
      const { client } = makeClient('x');
      client.data = {};

      await gateway.handleConnection(client);

      expect(client.disconnect).toHaveBeenCalledWith(true);
      expect(client.join).not.toHaveBeenCalled();
    });
  });

  describe('room:join', () => {
    it.each([
      ['candidate', 'candidate-1'],
      ['recruiter', 'recruiter-1'],
    ])('lets the %s join and tells the room', async (role, userId) => {
      const { client, roomEmit } = makeClient(userId);

      await gateway.onJoin(client, { interviewId: INTERVIEW_ID });

      expect(client.rooms.has(roomName(INTERVIEW_ID))).toBe(true);
      expect(client.emit).toHaveBeenCalledWith('room:joined', {
        interviewId: INTERVIEW_ID,
        sessionId: 'session-1',
        role: role.toUpperCase(),
        peers: [],
      });
      expect(roomEmit).toHaveBeenCalledWith('room:peer-joined', {
        userId,
        role: role.toUpperCase(),
      });
    });

    it('lists the peer already in the room', async () => {
      present = [
        {
          id: 'other',
          data: { userId: 'recruiter-1', role: 'RECRUITER' },
          emit: jest.fn(),
          leave: jest.fn(),
        },
      ];
      const { client } = makeClient('candidate-1');

      await gateway.onJoin(client, { interviewId: INTERVIEW_ID });

      expect(client.emit).toHaveBeenCalledWith(
        'room:joined',
        expect.objectContaining({
          peers: [{ userId: 'recruiter-1', role: 'RECRUITER' }],
        }),
      );
    });

    it('replaces an earlier socket of the same user', async () => {
      const older = {
        id: 'older',
        data: { userId: 'candidate-1' },
        emit: jest.fn(),
        leave: jest.fn(),
      };
      present = [older];
      const { client } = makeClient('candidate-1', 'newer');

      await gateway.onJoin(client, { interviewId: INTERVIEW_ID });

      expect(older.emit).toHaveBeenCalledWith('room:replaced', {
        interviewId: INTERVIEW_ID,
      });
      expect(older.leave).toHaveBeenCalledWith(roomName(INTERVIEW_ID));
    });

    it('refuses a user who is not a participant', async () => {
      const { client } = makeClient('stranger');

      await gateway.onJoin(client, { interviewId: INTERVIEW_ID });

      expect(lastError(client)).toBeDefined();
      expect(client.join).not.toHaveBeenCalled();
    });

    it('refuses an interview that does not use the room', async () => {
      readRepository.findItemById.mockResolvedValue(makeItem(false));
      const { client } = makeClient('candidate-1');

      await gateway.onJoin(client, { interviewId: INTERVIEW_ID });

      expect(lastError(client)[1].message).toMatch(/does not use/);
      expect(client.join).not.toHaveBeenCalled();
    });

    it('refuses while no session is open', async () => {
      sessionRepository.findOpenByInterviewId.mockResolvedValue(null);
      const { client } = makeClient('candidate-1');

      await gateway.onJoin(client, { interviewId: INTERVIEW_ID });

      expect(lastError(client)[1].message).toMatch(
        /Start the interview session/,
      );
      expect(client.join).not.toHaveBeenCalled();
    });

    it('refuses an unknown interview and a malformed payload without leaking internals', async () => {
      readRepository.findItemById.mockResolvedValue(null);
      const a = makeClient('candidate-1');
      await gateway.onJoin(a.client, { interviewId: INTERVIEW_ID });
      expect(lastError(a.client)).toBeDefined();

      const b = makeClient('candidate-1');
      await gateway.onJoin(b.client, { interviewId: 'not-a-uuid', extra: 1 });
      expect(lastError(b.client)).toBeDefined();
      expect(b.client.join).not.toHaveBeenCalled();
    });
  });

  describe('rtc:signal', () => {
    async function joined(userId: string) {
      const made = makeClient(userId);
      await gateway.onJoin(made.client, { interviewId: INTERVIEW_ID });
      made.roomEmit.mockClear();
      return made;
    }

    it('relays a valid signal to the other participant, stamped with the sender', async () => {
      const { client, roomEmit } = await joined('candidate-1');

      gateway.onSignal(client, { description: { type: 'offer', sdp: 'v=0' } });

      expect(client.to).toHaveBeenCalledWith(roomName(INTERVIEW_ID));
      expect(roomEmit).toHaveBeenCalledWith('rtc:signal', {
        from: 'candidate-1',
        description: { type: 'offer', sdp: 'v=0' },
      });
    });

    it('rejects signals from a socket that has not joined', () => {
      const { client, roomEmit } = makeClient('candidate-1');

      gateway.onSignal(client, { description: { type: 'offer', sdp: 'v=0' } });

      expect(lastError(client)).toBeDefined();
      expect(roomEmit).not.toHaveBeenCalled();
    });

    it('does not let a payload pick the target room', async () => {
      const { client, roomEmit } = await joined('candidate-1');

      gateway.onSignal(client, {
        description: { type: 'offer', sdp: 'v=0' },
        interviewId: 'some-other-room',
      });

      expect(lastError(client)).toBeDefined();
      expect(roomEmit).not.toHaveBeenCalled();
    });

    it('rejects an invalid payload', async () => {
      const { client, roomEmit } = await joined('candidate-1');

      gateway.onSignal(client, { description: { type: 'nope' } });

      expect(lastError(client)).toBeDefined();
      expect(roomEmit).not.toHaveBeenCalled();
    });

    it('rate-limits a flooding client', async () => {
      const { client, roomEmit } = await joined('candidate-1');
      const candidate = { candidate: { candidate: 'c' } };

      for (let i = 0; i < 250; i++) gateway.onSignal(client, candidate);

      expect(roomEmit).toHaveBeenCalledTimes(200);
      expect(lastError(client)[1].message).toMatch(/Too many/);
    });

    it('stops relaying once the room is closed', async () => {
      const { client, roomEmit } = await joined('candidate-1');

      client.rooms.delete(roomName(INTERVIEW_ID)); // what socketsLeave does
      gateway.onSignal(client, { description: { type: 'offer', sdp: 'v=0' } });

      expect(roomEmit).not.toHaveBeenCalled();
    });
  });

  describe('leaving and closing', () => {
    it('tells the room when a participant disconnects', async () => {
      const { client, roomEmit } = makeClient('candidate-1');
      await gateway.onJoin(client, { interviewId: INTERVIEW_ID });
      roomEmit.mockClear();

      gateway.handleDisconnect(client);

      expect(roomEmit).toHaveBeenCalledWith('room:peer-left', {
        userId: 'candidate-1',
      });
    });

    it('does not announce anything for a socket that never joined', () => {
      const { client, roomEmit } = makeClient('candidate-1');

      gateway.handleDisconnect(client);

      expect(roomEmit).not.toHaveBeenCalled();
    });

    it('closes the room for everyone when the session ends', () => {
      gateway.handleRoomClosed(new InterviewRoomClosedEvent(INTERVIEW_ID));

      expect(serverEmit).toHaveBeenCalledWith('room:closed', {
        interviewId: INTERVIEW_ID,
      });
      expect(socketsLeave).toHaveBeenCalledWith(roomName(INTERVIEW_ID));
    });
  });
});
