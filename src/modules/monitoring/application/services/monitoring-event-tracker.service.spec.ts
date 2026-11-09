import { ConfigService } from '@nestjs/config';
import { MonitoringEventTracker } from './monitoring-event-tracker.service';
import {
  IDetectionEventRepository,
  NewDetectionEvent,
} from '@/modules/monitoring/domain/repositories/detection-event.repository';

const T0 = Date.UTC(2026, 10, 9, 10, 0, 0);
const at = (s: number) => new Date(T0 + s * 1000);
const person = { className: 'person', confidence: 0.9 };
const phone = { className: 'cell phone', confidence: 0.8 };

function setup(overrides: Record<string, number> = {}) {
  const values: Record<string, number> = {
    MONITORING_EVENT_START_FRAMES: 3,
    MONITORING_EVENT_END_FRAMES: 3,
    MONITORING_EVENT_COOLDOWN_MS: 30_000,
    MONITORING_EVENT_STALE_MS: 15_000,
    ...overrides,
  };
  const config = {
    get: jest.fn((key: string, fallback?: unknown) => values[key] ?? fallback),
  } as unknown as ConfigService;
  let nextId = 1;
  const repository: jest.Mocked<IDetectionEventRepository> = {
    create: jest.fn<Promise<string>, [NewDetectionEvent]>(() =>
      Promise.resolve(`event-${nextId++}`),
    ),
    close: jest.fn().mockResolvedValue(undefined),
    findById: jest.fn(),
    listForInterview: jest.fn(),
    summarizeForInterview: jest.fn(),
    saveReview: jest.fn(),
    deleteDetectedBefore: jest.fn(),
  };
  const tracker = new MonitoringEventTracker(repository, config);
  const feed = async (sessionId: string, frames: object[][], from = 0) => {
    for (let i = 0; i < frames.length; i++) {
      await tracker.observe(
        sessionId,
        'interview-1',
        frames[i] as never,
        at(from + i),
      );
    }
  };
  return { tracker, repository, feed };
}

describe('MonitoringEventTracker', () => {
  it('persists the begin of an event once, linked to the session', async () => {
    const { repository, feed } = setup();

    await feed('session-1', [
      [person, phone],
      [person, phone],
      [person, phone],
      [person, phone],
    ]);

    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(repository.create).toHaveBeenCalledWith({
      interviewSessionId: 'session-1',
      eventType: 'PHONE_DETECTED',
      objectClass: 'cell phone',
      confidence: 0.8,
      detectedAt: at(0),
      frameCount: 3,
      metadata: { personCount: 1 },
    });
  });

  it('closes that same event when the condition clears', async () => {
    const { repository, feed } = setup();

    await feed('session-1', [
      [person, phone],
      [person, phone],
      [person, phone],
      [person],
      [person],
      [person],
    ]);

    expect(repository.close).toHaveBeenCalledWith('event-1', {
      endedAt: at(3),
      confidence: 0.8,
      frameCount: 3,
      metadata: { personCount: 1, endReason: 'condition-cleared' },
    });
  });

  it('keeps sessions apart', async () => {
    const { repository, feed } = setup();

    await feed('session-1', [
      [person, phone],
      [person, phone],
    ]);
    await feed('session-2', [[person, phone]], 2);

    expect(repository.create).not.toHaveBeenCalled();
  });

  it('stop() ends open events with the given reason and forgets the session', async () => {
    const { tracker, repository, feed } = setup();
    await feed('session-1', [
      [person, phone],
      [person, phone],
      [person, phone],
    ]);

    await tracker.stop('session-1', 'monitoring-stopped', at(9));

    expect(repository.close).toHaveBeenCalledWith(
      'event-1',
      expect.objectContaining({
        endedAt: at(9),
        metadata: expect.objectContaining({ endReason: 'monitoring-stopped' }),
      }),
    );
    await tracker.stop('session-1', 'monitoring-stopped');
    expect(repository.close).toHaveBeenCalledTimes(1);
  });

  it('stopInterview() ends tracking of every session of that interview only', async () => {
    const { tracker, repository } = setup({ MONITORING_EVENT_START_FRAMES: 1 });
    await tracker.observe(
      'session-1',
      'interview-1',
      [person, phone] as never,
      at(0),
    );
    await tracker.observe(
      'session-x',
      'interview-2',
      [person, phone] as never,
      at(0),
    );

    await tracker.stopInterview('interview-1', 'session-ended');

    expect(repository.close).toHaveBeenCalledTimes(1);
    expect(repository.close).toHaveBeenCalledWith('event-1', expect.anything());
  });

  it('sweep() ends events of sessions that stopped sending frames, at their last frame', async () => {
    const { tracker, repository, feed } = setup();
    await feed('session-1', [
      [person, phone],
      [person, phone],
      [person, phone],
    ]);

    await tracker.sweep(at(2).getTime() + 10_000); // not stale yet
    expect(repository.close).not.toHaveBeenCalled();

    await tracker.sweep(at(2).getTime() + 20_000);
    expect(repository.close).toHaveBeenCalledWith(
      'event-1',
      expect.objectContaining({
        endedAt: at(2),
        metadata: expect.objectContaining({ endReason: 'stale' }),
      }),
    );
  });

  it('never lets an end overtake its begin, even when the insert is slow', async () => {
    const { tracker, repository } = setup({
      MONITORING_EVENT_START_FRAMES: 1,
      MONITORING_EVENT_END_FRAMES: 1,
    });
    let release!: (id: string) => void;
    repository.create.mockReturnValueOnce(new Promise((r) => (release = r)));

    const begin = tracker.observe(
      'session-1',
      'interview-1',
      [person, phone] as never,
      at(0),
    );
    const end = tracker.observe(
      'session-1',
      'interview-1',
      [person] as never,
      at(1),
    );
    release('slow-event');
    await Promise.all([begin, end]);

    expect(repository.close).toHaveBeenCalledWith(
      'slow-event',
      expect.objectContaining({ endedAt: at(1) }),
    );
  });

  it('logs and carries on when persistence fails', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const { tracker, repository, feed } = setup({
      MONITORING_EVENT_START_FRAMES: 1,
      MONITORING_EVENT_END_FRAMES: 1,
    });
    repository.create.mockRejectedValueOnce(new Error('db down'));

    await expect(
      feed('session-1', [[person, phone], [person]]),
    ).resolves.toBeUndefined();
    // The begin was lost, so there is nothing to close — and no crash.
    expect(repository.close).not.toHaveBeenCalled();

    // The tracker keeps working for the next episode (after the cooldown).
    await tracker.observe(
      'session-1',
      'interview-1',
      [person, phone] as never,
      at(60),
    );
    expect(repository.create).toHaveBeenCalledTimes(2);
  });

  it('ends everything still open on shutdown', async () => {
    const { tracker, repository } = setup({ MONITORING_EVENT_START_FRAMES: 1 });
    await tracker.observe(
      'session-1',
      'interview-1',
      [person, phone] as never,
      at(0),
    );

    await tracker.onModuleDestroy();

    expect(repository.close).toHaveBeenCalledWith(
      'event-1',
      expect.objectContaining({
        metadata: expect.objectContaining({ endReason: 'server-shutdown' }),
      }),
    );
  });
});
