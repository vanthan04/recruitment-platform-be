export interface InterviewMailParams {
  jobTitle: string;
  scheduledAt: Date;
  location?: string | null;
  meetingLink?: string | null;
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
  const { jobTitle, scheduledAt, location, meetingLink, note } = params;

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
