import { ConfigService } from '@nestjs/config';
import { CommandBus } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import { MonitoringGateway, monitorRoom } from './monitoring.gateway';
import { IDetectionServicePort } from '@/modules/monitoring/application/ports/detection-service.port';
import { isJpeg } from '@/modules/monitoring/infrastructure/frame.util';
import { RecordMonitoringConsentCommand } from '@/modules/interview/application/commands/record-monitoring-consent.command';
import { InterviewMonitoringNotAllowedException } from '@/modules/interview/domain/exceptions/interview.exceptions';
import { InterviewRoomClosedEvent } from '@/modules/interview/infrastructure/events/interview-room-closed.event';

const INTERVIEW_ID = '11111111-1111-4111-8111-111111111111';
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);
const result = {
  imageWidth: 640,
  imageHeight: 360,
  inferenceMs: 40,
  detections: [],
};

function makeClient(userId = 'candidate-1') {
  const client: any = {
    id: `sock-${userId}`,
    data: { userId },
    rooms: new Set<string>(),
    handshake: { headers: {} },
    emit: jest.fn(),
    disconnect: jest.fn(),
    join: jest.fn((room: string) => {
      client.rooms.add(room);
      return Promise.resolve();
    }),
    leave: jest.fn((room: string) => {
      client.rooms.delete(room);
      return Promise.resolve();
    }),
  };
  return client;
}

describe('MonitoringGateway', () => {
  let commandBus: { execute: jest.Mock };
  let detection: jest.Mocked<IDetectionServicePort>;
  let gateway: MonitoringGateway;
  let serverEmit: jest.Mock;
  let socketsLeave: jest.Mock;
  let now: number;

  beforeEach(() => {
    now = 1_000_000;
    jest.spyOn(Date, 'now').mockImplementation(() => now);
    commandBus = {
      execute: jest.fn().mockResolvedValue({
        sessionId: 'session-1',
        consentedAt: new Date('2026-11-09T10:00:00Z'),
        noticeVersion: 'v1',
      }),
    };
    detection = {
      isConfigured: jest.fn().mockReturnValue(true),
      detectFrame: jest.fn().mockResolvedValue({ status: 'ok', result }),
    };
    const config = {
      get: jest.fn((key: string, fallback: unknown) =>
        key === 'MONITORING_MAX_FRAME_BYTES' ? 1000 : fallback,
      ),
    } as unknown as ConfigService;
    gateway = new MonitoringGateway(
      { verifyAsync: jest.fn() } as unknown as JwtService,
      commandBus as unknown as CommandBus,
      detection,
      config,
    );
    serverEmit = jest.fn();
    socketsLeave = jest.fn();
    gateway.server = {
      in: jest.fn(() => ({
        emit: serverEmit,
        socketsLeave,
        disconnectSockets: jest.fn(),
      })),
    } as any;
  });

  afterEach(() => jest.restoreAllMocks());

  const start = (client: any) =>
    gateway.onStart(client, { interviewId: INTERVIEW_ID, noticeVersion: 'v1' });

  describe('handleConnection', () => {
    it('disconnects a handshake without the auth cookie', async () => {
      const client = makeClient();
      client.data = {};
      await gateway.handleConnection(client);
      expect(client.disconnect).toHaveBeenCalledWith(true);
    });
  });

  describe('monitor:start', () => {
    it('records consent through the interview module, then accepts frames', async () => {
      const client = makeClient();

      const ack = await start(client);

      expect(commandBus.execute).toHaveBeenCalledWith(
        new RecordMonitoringConsentCommand('candidate-1', INTERVIEW_ID, 'v1'),
      );
      expect(ack).toEqual({
        ok: true,
        sessionId: 'session-1',
        consentedAt: '2026-11-09T10:00:00.000Z',
        maxFrameBytes: 1000,
        minFrameIntervalMs: 500,
      });
      expect(client.rooms.has(monitorRoom(INTERVIEW_ID))).toBe(true);
    });

    it('passes on a refusal (e.g. the recruiter trying) without joining', async () => {
      commandBus.execute.mockRejectedValue(
        new InterviewMonitoringNotAllowedException(),
      );
      const client = makeClient('recruiter-1');

      const ack = await start(client);

      expect(ack).toMatchObject({
        ok: false,
        code: 'INTERVIEW_MONITORING_NOT_ALLOWED',
      });
      expect(client.join).not.toHaveBeenCalled();
    });

    it('reports AI_UNAVAILABLE without recording consent when the AI service is not configured', async () => {
      detection.isConfigured.mockReturnValue(false);

      const ack = await start(makeClient());

      expect(ack).toMatchObject({ ok: false, code: 'AI_UNAVAILABLE' });
      expect(commandBus.execute).not.toHaveBeenCalled();
    });

    it('validates the payload and hides internal errors', async () => {
      const bad = await gateway.onStart(makeClient(), {
        interviewId: 'not-a-uuid',
        noticeVersion: 'v1',
      });
      expect(bad).toMatchObject({ ok: false });

      commandBus.execute.mockRejectedValue(
        new Error('connection refused at 10.0.0.5'),
      );
      const internal = await start(makeClient());
      expect(internal).toEqual({
        ok: false,
        code: 'START_REFUSED',
        message: 'Something went wrong, please try again',
      });
    });
  });

  describe('monitor:frame', () => {
    async function started() {
      const client = makeClient();
      await start(client);
      return client;
    }

    it('forwards a JPEG and returns the detections', async () => {
      const client = await started();

      await expect(gateway.onFrame(client, JPEG)).resolves.toEqual({
        ok: true,
        data: result,
      });
      expect(detection.detectFrame).toHaveBeenCalledWith(JPEG);
    });

    it('refuses frames before monitoring is started', async () => {
      await expect(gateway.onFrame(makeClient(), JPEG)).resolves.toEqual({
        ok: false,
        code: 'NOT_STARTED',
      });
      expect(detection.detectFrame).not.toHaveBeenCalled();
    });

    it.each([
      ['a string', 'data:image/jpeg;base64,xx', 'INVALID_FRAME'],
      ['a PNG', Buffer.from([0x89, 0x50, 0x4e, 0x47, 0, 0]), 'INVALID_FRAME'],
      [
        'an oversized frame',
        Buffer.concat([JPEG, Buffer.alloc(2000)]),
        'FRAME_TOO_LARGE',
      ],
    ])(
      'rejects %s without calling the AI service',
      async (_label, frame, code) => {
        const client = await started();
        await expect(gateway.onFrame(client, frame)).resolves.toEqual({
          ok: false,
          code,
        });
        expect(detection.detectFrame).not.toHaveBeenCalled();
      },
    );

    it('enforces the minimum interval between frames', async () => {
      const client = await started();
      await gateway.onFrame(client, JPEG);

      now += 200;
      await expect(gateway.onFrame(client, JPEG)).resolves.toEqual({
        ok: false,
        code: 'RATE_LIMITED',
      });
      now += 400;
      await expect(gateway.onFrame(client, JPEG)).resolves.toMatchObject({
        ok: true,
      });
    });

    it('keeps at most one frame in flight per socket', async () => {
      const client = await started();
      let release!: () => void;
      detection.detectFrame.mockReturnValueOnce(
        new Promise((resolve) => {
          release = () => resolve({ status: 'ok', result });
        }),
      );

      const first = gateway.onFrame(client, JPEG);
      now += 1000;
      await expect(gateway.onFrame(client, JPEG)).resolves.toEqual({
        ok: false,
        code: 'BUSY',
      });
      release();
      await expect(first).resolves.toMatchObject({ ok: true });
      now += 1000;
      await expect(gateway.onFrame(client, JPEG)).resolves.toMatchObject({
        ok: true,
      });
    });

    it.each([
      [{ status: 'busy' }, 'AI_BUSY'],
      [{ status: 'unavailable' }, 'AI_UNAVAILABLE'],
      [{ status: 'rejected' }, 'AI_REJECTED'],
    ])('maps %o to %s', async (outcome, code) => {
      detection.detectFrame.mockResolvedValue(outcome as never);
      const client = await started();
      await expect(gateway.onFrame(client, JPEG)).resolves.toEqual({
        ok: false,
        code,
      });
    });

    it('treats an adapter crash as unavailable and frees the slot', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      detection.detectFrame.mockRejectedValueOnce(new Error('boom'));
      const client = await started();

      await expect(gateway.onFrame(client, JPEG)).resolves.toEqual({
        ok: false,
        code: 'AI_UNAVAILABLE',
      });
      now += 1000;
      await expect(gateway.onFrame(client, JPEG)).resolves.toMatchObject({
        ok: true,
      });
    });
  });

  describe('stopping', () => {
    it('monitor:stop stops accepting frames', async () => {
      const client = makeClient();
      await start(client);

      expect(gateway.onStop(client)).toEqual({ ok: true });
      await expect(gateway.onFrame(client, JPEG)).resolves.toEqual({
        ok: false,
        code: 'NOT_STARTED',
      });
    });

    it('stops everyone in the interview when the session ends', async () => {
      const client = makeClient();
      await start(client);

      gateway.handleRoomClosed(new InterviewRoomClosedEvent(INTERVIEW_ID));
      expect(serverEmit).toHaveBeenCalledWith('monitor:stopped', {
        interviewId: INTERVIEW_ID,
        reason: 'session-ended',
      });
      expect(socketsLeave).toHaveBeenCalledWith(monitorRoom(INTERVIEW_ID));

      client.rooms.delete(monitorRoom(INTERVIEW_ID)); // what socketsLeave does
      await expect(gateway.onFrame(client, JPEG)).resolves.toEqual({
        ok: false,
        code: 'NOT_STARTED',
      });
    });
  });
});

describe('isJpeg', () => {
  it('recognises the JPEG start-of-image marker only', () => {
    expect(isJpeg(JPEG)).toBe(true);
    expect(isJpeg(Buffer.from([0xff, 0xd8]))).toBe(false);
    expect(isJpeg(Buffer.from('GIF89a'))).toBe(false);
  });
});
