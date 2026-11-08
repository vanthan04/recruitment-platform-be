import {
  buildInterviewEmail,
  buildInterviewReminderEmail,
  formatTimeUntil,
} from './interview-mail.util';

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

describe('formatTimeUntil', () => {
  const HOUR = 60 * 60 * 1000;

  it('says "chưa đầy 1 giờ" under an hour', () => {
    expect(formatTimeUntil(0)).toBe('chưa đầy 1 giờ');
    expect(formatTimeUntil(59 * 60 * 1000)).toBe('chưa đầy 1 giờ');
  });

  it('rounds to the nearest whole hour from one hour up', () => {
    expect(formatTimeUntil(HOUR)).toBe('khoảng 1 giờ');
    expect(formatTimeUntil(2 * HOUR - 5 * 60 * 1000)).toBe('khoảng 2 giờ');
    expect(formatTimeUntil(24 * HOUR)).toBe('khoảng 24 giờ');
  });
});

describe('buildInterviewReminderEmail', () => {
  // 07:00 UTC = 14:00 Asia/Ho_Chi_Minh
  const scheduledAt = new Date('2026-03-10T07:00:00.000Z');
  const now = new Date('2026-03-09T07:00:00.000Z'); // 24h earlier
  const base = {
    jobTitle: 'Backend Engineer',
    scheduledAt,
    now,
    candidateName: 'Nguyễn Văn A',
  };

  it('gives the candidate a reminder about the job, in Vietnam time, with how long is left', () => {
    const { subject, html } = buildInterviewReminderEmail({
      ...base,
      audience: 'candidate',
      meetingLink: 'https://meet.google.com/abc-defg-hij',
    });

    expect(subject).toBe('Nhắc lịch phỏng vấn cho vị trí "Backend Engineer"');
    expect(html).toContain('Nhắc lịch');
    expect(html).toContain('Backend Engineer');
    expect(html).toContain('14:00');
    expect(html).toContain('GMT+7');
    expect(html).toContain('còn khoảng 24 giờ');
    expect(html).toContain('href="https://meet.google.com/abc-defg-hij"');
    // The candidate is not told their own name.
    expect(html).not.toContain('Nguyễn Văn A');
  });

  it("names the candidate in the recruiter's email", () => {
    const { html } = buildInterviewReminderEmail({
      ...base,
      audience: 'recruiter',
      location: '123 Nguyen Van Cu, Q5',
    });

    expect(html).toContain('ứng viên <b>Nguyễn Văn A</b>');
    expect(html).toContain(
      'Địa điểm phỏng vấn trực tiếp: 123 Nguyen Van Cu, Q5',
    );
  });

  it("falls back to the generic wording when the candidate's name is unknown", () => {
    const { html } = buildInterviewReminderEmail({
      ...base,
      candidateName: null,
      audience: 'recruiter',
    });

    expect(html).not.toContain('ứng viên');
    expect(html).toContain('bạn có buổi phỏng vấn cho vị trí');
  });

  it('shows "còn" for the actual time left, e.g. the 2h reminder', () => {
    const { html } = buildInterviewReminderEmail({
      ...base,
      audience: 'candidate',
      now: new Date(scheduledAt.getTime() - 2 * 60 * 60 * 1000),
    });
    expect(html).toContain('còn khoảng 2 giờ');
  });

  it('omits the optional lines it was not given', () => {
    const { html } = buildInterviewReminderEmail({
      ...base,
      audience: 'candidate',
    });
    expect(html).not.toContain('Link tham gia');
    expect(html).not.toContain('Địa điểm');
    expect(html).not.toContain('Ghi chú');
  });

  describe('escaping text people typed', () => {
    it("cannot inject markup into the recruiter's email through the candidate's name", () => {
      const { html } = buildInterviewReminderEmail({
        ...base,
        candidateName: '<img src=x onerror=alert(1)>',
        audience: 'recruiter',
      });
      expect(html).not.toContain('<img');
      expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    });

    it('escapes the job title, location and note', () => {
      const { html } = buildInterviewReminderEmail({
        ...base,
        jobTitle: 'Dev <b>&</b> Ops',
        location: '<script>x</script>',
        note: 'a "quoted" note',
        audience: 'candidate',
      });
      expect(html).toContain('Dev &lt;b&gt;&amp;&lt;/b&gt; Ops');
      expect(html).toContain('&lt;script&gt;x&lt;/script&gt;');
      expect(html).toContain('a &quot;quoted&quot; note');
      expect(html).not.toContain('<script>');
    });

    it('only makes a real http(s) link clickable', () => {
      const bad = buildInterviewReminderEmail({
        ...base,
        meetingLink: 'javascript:alert(1)',
        audience: 'candidate',
      });
      expect(bad.html).not.toContain('<a ');
      expect(bad.html).toContain('javascript:alert(1)');

      const quoteBreakout = buildInterviewReminderEmail({
        ...base,
        meetingLink: 'https://x.test/"onclick="alert(1)',
        audience: 'candidate',
      });
      expect(quoteBreakout.html).not.toContain('"onclick=');
    });
  });
});
