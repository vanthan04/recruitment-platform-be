export interface InterviewMailParams {
  jobTitle: string;
  scheduledAt: Date;
  location?: string | null;
  meetingLink?: string | null;
  /** Held in the platform's own video room. */
  useRoom?: boolean;
  note?: string | null;
}

// Without an explicit `timeZone`, this follows the Node process's own
// runtime timezone — commonly UTC in a container — not the candidate's.
// An interview at 14:00 in Vietnam would otherwise render as "07:00" with
// no indication anything was converted, a real scheduling failure rather
// than a cosmetic one. The zone is also spelled out in the string itself so
// the time is unambiguous even if a mail client's own rendering doesn't
// preserve the locale formatting.
const INTERVIEW_TIME_ZONE = 'Asia/Ho_Chi_Minh';

const formatDateTime = (date: Date): string =>
  `${date.toLocaleString('vi-VN', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: INTERVIEW_TIME_ZONE,
  })} (giờ Việt Nam, GMT+7)`;

export function buildInterviewEmail(
  action: 'scheduled' | 'rescheduled' | 'cancelled',
  params: InterviewMailParams,
): { subject: string; html: string } {
  const { jobTitle, scheduledAt, location, meetingLink, useRoom, note } =
    params;

  if (action === 'cancelled') {
    return {
      subject: `Lịch phỏng vấn cho vị trí "${jobTitle}" đã bị huỷ`,
      html: `<p>Lịch phỏng vấn cho vị trí <b>${jobTitle}</b> vào lúc <b>${formatDateTime(scheduledAt)}</b> đã bị <b>huỷ</b>.</p>`,
    };
  }

  const actionLabel =
    action === 'rescheduled' ? 'đã được dời sang' : 'đã được lên lịch vào';
  const lines: string[] = [
    `<p>Lịch phỏng vấn cho vị trí <b>${jobTitle}</b> ${actionLabel} <b>${formatDateTime(scheduledAt)}</b>.</p>`,
  ];
  if (meetingLink) {
    lines.push(
      `<p>Link tham gia phỏng vấn online: <a href="${meetingLink}">${meetingLink}</a></p>`,
    );
  }
  if (useRoom) {
    lines.push(
      '<p>Phỏng vấn online ngay trên nền tảng: đăng nhập, mở mục <b>Lịch phỏng vấn</b>, chọn buổi phỏng vấn này và vào phòng video.</p>',
    );
  }
  if (location) {
    lines.push(`<p>Địa điểm phỏng vấn trực tiếp: ${location}</p>`);
  }
  if (note) {
    lines.push(`<p>Ghi chú: ${note}</p>`);
  }

  return {
    subject:
      action === 'rescheduled'
        ? `Lịch phỏng vấn cho vị trí "${jobTitle}" đã được dời lịch`
        : `Bạn có lịch phỏng vấn cho vị trí "${jobTitle}"`,
    html: lines.join(''),
  };
}

// The reminder mixes in text people typed (a candidate's name, a job title, a
// location, a note) and goes to a *different* person than the one who typed
// it, so — unlike the booking emails above — it is escaped. (A candidate's
// name must not be able to put markup into the recruiter's inbox.)
const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const ONE_HOUR_MS = 60 * 60 * 1000;

/** "khoảng 24 giờ" / "chưa đầy 1 giờ" — how long until the interview, as of when the reminder is sent. */
export function formatTimeUntil(ms: number): string {
  if (ms < ONE_HOUR_MS) return 'chưa đầy 1 giờ';
  return `khoảng ${Math.round(ms / ONE_HOUR_MS)} giờ`;
}

export interface InterviewReminderParams extends InterviewMailParams {
  /** Sent-at time, so the "còn khoảng N giờ" is accurate for this send. */
  now: Date;
  /** Who the email is for: the candidate is told about the job, the recruiter about the candidate. */
  audience: 'candidate' | 'recruiter';
  /** The other person's name (the candidate's, for the recruiter's email). */
  candidateName?: string | null;
}

export function buildInterviewReminderEmail(params: InterviewReminderParams): {
  subject: string;
  html: string;
} {
  const {
    jobTitle,
    scheduledAt,
    location,
    meetingLink,
    useRoom,
    note,
    now,
    audience,
    candidateName,
  } = params;

  const until = formatTimeUntil(scheduledAt.getTime() - now.getTime());
  const title = escapeHtml(jobTitle);
  const when = `<b>${formatDateTime(scheduledAt)}</b> (còn ${until})`;

  const intro =
    audience === 'recruiter' && candidateName
      ? `<p>Nhắc lịch: bạn có buổi phỏng vấn ứng viên <b>${escapeHtml(candidateName)}</b> cho vị trí <b>${title}</b> vào ${when}.</p>`
      : `<p>Nhắc lịch: bạn có buổi phỏng vấn cho vị trí <b>${title}</b> vào ${when}.</p>`;

  const lines: string[] = [intro];
  if (meetingLink) {
    // Only a real web link becomes clickable; anything else (a typo, a
    // `javascript:` URL) is shown as inert text.
    lines.push(
      /^https?:\/\//i.test(meetingLink)
        ? `<p>Link tham gia phỏng vấn online: <a href="${escapeHtml(meetingLink)}">${escapeHtml(meetingLink)}</a></p>`
        : `<p>Link tham gia phỏng vấn online: ${escapeHtml(meetingLink)}</p>`,
    );
  }
  if (useRoom) {
    lines.push(
      '<p>Phỏng vấn online ngay trên nền tảng: đăng nhập, mở mục <b>Lịch phỏng vấn</b>, chọn buổi phỏng vấn này và vào phòng video.</p>',
    );
  }
  if (location) {
    lines.push(`<p>Địa điểm phỏng vấn trực tiếp: ${escapeHtml(location)}</p>`);
  }
  if (note) {
    lines.push(`<p>Ghi chú: ${escapeHtml(note)}</p>`);
  }

  return {
    subject: `Nhắc lịch phỏng vấn cho vị trí "${jobTitle}"`,
    html: lines.join(''),
  };
}
