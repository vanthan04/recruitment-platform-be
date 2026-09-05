import { buildInterviewEmail } from './interview-mail.util';

describe('buildInterviewEmail', () => {
  // 07:00 UTC = 14:00 Asia/Ho_Chi_Minh (UTC+7) — the exact case a missing
  // `timeZone` option silently gets wrong when the server runs in UTC.
  const scheduledAt = new Date('2026-03-10T07:00:00.000Z');

  it('renders the scheduled time converted to Vietnam time, not the server/UTC time', () => {
    const { html } = buildInterviewEmail('scheduled', {
      jobTitle: 'Backend Engineer',
      scheduledAt,
    });

    expect(html).toContain('14:00');
    expect(html).not.toContain('07:00');
  });

  it('labels the time zone explicitly so it is unambiguous regardless of mail-client rendering', () => {
    const { html } = buildInterviewEmail('scheduled', {
      jobTitle: 'Backend Engineer',
      scheduledAt,
    });

    expect(html).toContain('GMT+7');
  });

  it('applies the same conversion to rescheduled and cancelled notices', () => {
    const rescheduled = buildInterviewEmail('rescheduled', {
      jobTitle: 'Backend Engineer',
      scheduledAt,
    });
    const cancelled = buildInterviewEmail('cancelled', {
      jobTitle: 'Backend Engineer',
      scheduledAt,
    });

    expect(rescheduled.html).toContain('14:00');
    expect(cancelled.html).toContain('14:00');
  });
});
