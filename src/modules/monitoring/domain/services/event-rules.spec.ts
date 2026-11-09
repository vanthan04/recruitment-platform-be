import {
  SessionEventRules,
  ObservedDetection,
  EventTransition,
} from './event-rules';

const config = {
  minConfidence: 0.5,
  startFrames: 3,
  endFrames: 3,
  cooldownMs: 30_000,
};
const T0 = Date.UTC(2026, 10, 9, 10, 0, 0);
const at = (second: number) => new Date(T0 + second * 1000);

const person = (confidence = 0.9): ObservedDetection => ({
  className: 'person',
  confidence,
});
const phone = (confidence = 0.8): ObservedDetection => ({
  className: 'cell phone',
  confidence,
});
const laptop = (confidence = 0.7): ObservedDetection => ({
  className: 'laptop',
  confidence,
});

/** Feeds one frame per second starting at `from`; returns all transitions. */
function feed(
  rules: SessionEventRules,
  frames: ObservedDetection[][],
  from = 0,
): EventTransition[] {
  return frames.flatMap((detections, i) =>
    rules.observe(detections, at(from + i)),
  );
}

const repeat = <T>(item: T, n: number): T[] =>
  Array.from({ length: n }, () => item);

describe('SessionEventRules', () => {
  it('produces nothing for a normal frame (exactly one person, no objects)', () => {
    const rules = new SessionEventRules(config);
    expect(feed(rules, repeat([person()], 20))).toEqual([]);
  });

  it('begins PHONE_DETECTED only after N consecutive frames, dated at the first one', () => {
    const rules = new SessionEventRules(config);

    expect(feed(rules, repeat([person(), phone(0.8)], 2))).toEqual([]);
    const third = rules.observe([person(), phone(0.9)], at(2));

    expect(third).toEqual([
      {
        kind: 'begin',
        eventType: 'PHONE_DETECTED',
        objectClass: 'cell phone',
        detectedAt: at(0),
        confidence: 0.9,
        frameCount: 3,
        metadata: { personCount: 1 },
      },
    ]);
  });

  it('a broken streak restarts the count (no event from flicker)', () => {
    const rules = new SessionEventRules(config);
    const frames = [
      [person(), phone()],
      [person(), phone()],
      [person()],
      [person(), phone()],
      [person(), phone()],
    ];
    expect(feed(rules, frames)).toEqual([]);
  });

  it('ignores detections below the event confidence threshold', () => {
    const rules = new SessionEventRules(config);
    expect(feed(rules, repeat([person(), phone(0.49)], 10))).toEqual([]);
  });

  it('emits one event per episode, not one per frame, and ends it after M clear frames', () => {
    const rules = new SessionEventRules(config);
    const transitions = feed(rules, [
      ...repeat([person(), phone(0.7)], 10),
      [person(), phone(0.95)],
      ...repeat([person()], 3),
    ]);

    expect(transitions.map((t) => t.kind)).toEqual(['begin', 'end']);
    const end = transitions[1];
    expect(end).toEqual({
      kind: 'end',
      eventType: 'PHONE_DETECTED',
      endedAt: at(11), // first clear frame
      confidence: 0.95, // peak over the whole event
      frameCount: 11,
      metadata: { personCount: 1, endReason: 'condition-cleared' },
    });
  });

  it('does not end on a short gap shorter than endFrames', () => {
    const rules = new SessionEventRules(config);
    const transitions = feed(rules, [
      ...repeat([person(), phone()], 3),
      [person()],
      [person()],
      ...repeat([person(), phone()], 3),
    ]);
    expect(transitions.map((t) => t.kind)).toEqual(['begin']);
  });

  it('applies the cooldown before the same type can begin again', () => {
    const rules = new SessionEventRules(config);
    // begin at 0, end at 3 (first clear frame), cooldown until 33s.
    feed(rules, [...repeat([person(), phone()], 3), ...repeat([person()], 3)]);

    expect(feed(rules, repeat([person(), phone()], 20), 6)).toEqual([]); // 6..25s: cooling down
    const again = feed(rules, repeat([person(), phone()], 3), 40);
    expect(again.map((t) => [t.kind, t.eventType])).toEqual([
      ['begin', 'PHONE_DETECTED'],
    ]);
  });

  it('PERSON_ABSENT: begins when nobody is visible, strength is 1 minus the best person score', () => {
    const rules = new SessionEventRules(config);
    const transitions = feed(rules, [[], [person(0.3)], []]);

    expect(transitions).toEqual([
      expect.objectContaining({
        kind: 'begin',
        eventType: 'PERSON_ABSENT',
        objectClass: 'person',
        detectedAt: at(0),
        confidence: 1, // peak: the frames with nobody at all
        metadata: { personCount: 0 },
      }),
    ]);
  });

  it('MULTIPLE_PERSONS: two confident people, evidence is the second-best score', () => {
    const rules = new SessionEventRules(config);
    const transitions = feed(
      rules,
      repeat([person(0.95), person(0.62), person(0.2)], 3),
    );

    expect(transitions).toEqual([
      expect.objectContaining({
        kind: 'begin',
        eventType: 'MULTIPLE_PERSONS',
        confidence: 0.62,
        metadata: { personCount: 2 },
      }),
    ]);
  });

  it('tracks types independently: a phone and a laptop at once are two events', () => {
    const rules = new SessionEventRules(config);
    const transitions = feed(rules, repeat([person(), phone(), laptop()], 3));
    expect(transitions.map((t) => t.eventType).sort()).toEqual([
      'LAPTOP_DETECTED',
      'PHONE_DETECTED',
    ]);
  });

  it('closeAll ends open events at the given time with the given reason, and nothing else', () => {
    const rules = new SessionEventRules(config);
    feed(rules, repeat([person(), phone()], 3));

    const closed = rules.closeAll(at(10), 'monitoring-stopped');

    expect(closed).toEqual([
      expect.objectContaining({
        kind: 'end',
        eventType: 'PHONE_DETECTED',
        endedAt: at(10),
        metadata: { personCount: 1, endReason: 'monitoring-stopped' },
      }),
    ]);
    expect(rules.closeAll(at(11), 'monitoring-stopped')).toEqual([]);
  });

  it('closeAll during a partial miss streak ends at the first missed frame', () => {
    const rules = new SessionEventRules(config);
    feed(rules, [...repeat([person(), phone()], 3), [person()]]);

    const [end] = rules.closeAll(at(30), 'stale');
    expect(end).toMatchObject({ kind: 'end', endedAt: at(3) });
  });

  it('startFrames = 1 begins immediately', () => {
    const rules = new SessionEventRules({ ...config, startFrames: 1 });
    expect(
      rules.observe([person(), phone()], at(0)).map((t) => t.kind),
    ).toEqual(['begin']);
  });
});
