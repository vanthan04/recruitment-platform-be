/**
 * Turns a stream of per-frame detections into begin/end events. Pure: no
 * framework, no I/O, no clock of its own — the caller passes each frame's time.
 *
 * Event types (observational labels, never findings of misconduct):
 * - PERSON_ABSENT     no person at or above minConfidence
 * - MULTIPLE_PERSONS  two or more persons at or above minConfidence
 * - PHONE_DETECTED    a 'cell phone' at or above minConfidence
 * - LAPTOP_DETECTED   a 'laptop' at or above minConfidence
 *
 * Lifecycle, per type and independently of the others:
 * - begins when the condition holds in `startFrames` consecutive frames;
 *   `detectedAt` is the first frame of that streak;
 * - ends when it has not held in `endFrames` consecutive frames; `endedAt` is
 *   the first frame of that miss streak — or the time of an explicit close;
 * - after it ends, the same type cannot begin again for `cooldownMs`;
 * - at most one open event per type.
 */

export const MONITORING_EVENT_TYPES = [
  'PERSON_ABSENT',
  'MULTIPLE_PERSONS',
  'PHONE_DETECTED',
  'LAPTOP_DETECTED',
] as const;
export type MonitoringEventType = (typeof MONITORING_EVENT_TYPES)[number];

export interface EventRuleConfig {
  minConfidence: number;
  startFrames: number;
  endFrames: number;
  cooldownMs: number;
}

export interface ObservedDetection {
  className: string;
  confidence: number;
}

export type EventEndReason =
  | 'condition-cleared'
  | 'monitoring-stopped'
  | 'session-ended'
  | 'stale'
  | 'server-shutdown';

export type EventTransition =
  | {
      kind: 'begin';
      eventType: MonitoringEventType;
      objectClass: string;
      detectedAt: Date;
      confidence: number;
      frameCount: number;
      metadata: Record<string, number>;
    }
  | {
      kind: 'end';
      eventType: MonitoringEventType;
      endedAt: Date;
      confidence: number;
      frameCount: number;
      metadata: Record<string, number | string>;
    };

interface Condition {
  holds: boolean;
  /** Evidence strength for this frame, 0..1. */
  confidence: number;
  personCount: number;
}

const OBJECT_CLASS: Record<MonitoringEventType, string> = {
  PERSON_ABSENT: 'person',
  MULTIPLE_PERSONS: 'person',
  PHONE_DETECTED: 'cell phone',
  LAPTOP_DETECTED: 'laptop',
};

function evaluate(
  type: MonitoringEventType,
  detections: ObservedDetection[],
  minConfidence: number,
): Condition {
  const persons = detections
    .filter((d) => d.className === 'person')
    .map((d) => d.confidence)
    .sort((a, b) => b - a);
  const confident = persons.filter((c) => c >= minConfidence);
  const best = (className: string) =>
    Math.max(
      0,
      ...detections
        .filter((d) => d.className === className)
        .map((d) => d.confidence),
    );

  switch (type) {
    case 'PERSON_ABSENT':
      // Strength of "nobody is there": 1 minus the best (even sub-threshold) person score.
      return {
        holds: confident.length === 0,
        confidence: 1 - (persons[0] ?? 0),
        personCount: confident.length,
      };
    case 'MULTIPLE_PERSONS':
      // The second-most-confident person is the evidence that there are two.
      return {
        holds: confident.length >= 2,
        confidence: confident[1] ?? 0,
        personCount: confident.length,
      };
    case 'PHONE_DETECTED': {
      const c = best('cell phone');
      return {
        holds: c >= minConfidence,
        confidence: c,
        personCount: confident.length,
      };
    }
    case 'LAPTOP_DETECTED': {
      const c = best('laptop');
      return {
        holds: c >= minConfidence,
        confidence: c,
        personCount: confident.length,
      };
    }
  }
}

interface TypeState {
  open: boolean;
  /** Consecutive holding frames while not open. */
  streak: number;
  streakStartedAt: Date | null;
  streakPeak: number;
  /** While open. */
  frameCount: number;
  peak: number;
  maxPersons: number;
  misses: number;
  firstMissAt: Date | null;
  cooldownUntil: number;
}

const freshState = (): TypeState => ({
  open: false,
  streak: 0,
  streakStartedAt: null,
  streakPeak: 0,
  frameCount: 0,
  peak: 0,
  maxPersons: 0,
  misses: 0,
  firstMissAt: null,
  cooldownUntil: 0,
});

const round4 = (n: number) => Math.round(n * 10_000) / 10_000;

export class SessionEventRules {
  private readonly states = new Map<MonitoringEventType, TypeState>(
    MONITORING_EVENT_TYPES.map((t) => [t, freshState()]),
  );

  constructor(private readonly config: EventRuleConfig) {}

  /** Feeds one analysed frame; returns the events that began or ended because of it. */
  observe(detections: ObservedDetection[], at: Date): EventTransition[] {
    const out: EventTransition[] = [];
    for (const type of MONITORING_EVENT_TYPES) {
      const state = this.states.get(type)!;
      const c = evaluate(type, detections, this.config.minConfidence);

      if (state.open) {
        if (c.holds) {
          state.frameCount += 1;
          state.peak = Math.max(state.peak, c.confidence);
          state.maxPersons = Math.max(state.maxPersons, c.personCount);
          state.misses = 0;
          state.firstMissAt = null;
        } else {
          state.misses += 1;
          state.firstMissAt ??= at;
          if (state.misses >= this.config.endFrames) {
            out.push(
              this.end(type, state, state.firstMissAt, 'condition-cleared'),
            );
          }
        }
        continue;
      }

      if (!c.holds || at.getTime() < state.cooldownUntil) {
        state.streak = 0;
        state.streakStartedAt = null;
        state.streakPeak = 0;
        continue;
      }
      state.streak += 1;
      state.streakStartedAt ??= at;
      state.streakPeak = Math.max(state.streakPeak, c.confidence);
      state.maxPersons = Math.max(state.maxPersons, c.personCount);
      if (state.streak >= this.config.startFrames) {
        state.open = true;
        state.frameCount = state.streak;
        state.peak = state.streakPeak;
        out.push({
          kind: 'begin',
          eventType: type,
          objectClass: OBJECT_CLASS[type],
          detectedAt: state.streakStartedAt,
          confidence: round4(state.peak),
          frameCount: state.frameCount,
          metadata: { personCount: state.maxPersons },
        });
      }
    }
    return out;
  }

  /** Ends every open event now (monitoring stopped, session ended, stale, shutdown). */
  closeAll(at: Date, reason: EventEndReason): EventTransition[] {
    const out: EventTransition[] = [];
    for (const type of MONITORING_EVENT_TYPES) {
      const state = this.states.get(type)!;
      if (state.open)
        out.push(this.end(type, state, state.firstMissAt ?? at, reason));
    }
    return out;
  }

  private end(
    type: MonitoringEventType,
    state: TypeState,
    endedAt: Date,
    reason: EventEndReason,
  ): EventTransition {
    const transition: EventTransition = {
      kind: 'end',
      eventType: type,
      endedAt,
      confidence: round4(state.peak),
      frameCount: state.frameCount,
      metadata: { personCount: state.maxPersons, endReason: reason },
    };
    const cooldownUntil = endedAt.getTime() + this.config.cooldownMs;
    this.states.set(type, { ...freshState(), cooldownUntil });
    return transition;
  }
}
