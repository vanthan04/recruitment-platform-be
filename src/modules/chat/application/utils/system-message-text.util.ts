// Vietnamese labels for the pipeline statuses, matching the frontend's
// APPLICATION_STATUS_LABEL — the wording a user already sees on the status
// badge, so the in-chat line and the badge never disagree.
const APPLICATION_STATUS_LABEL: Record<string, string> = {
  APPLIED: 'Đã ứng tuyển',
  SCREENING: 'Đang sàng lọc',
  SHORTLISTED: 'Vào danh sách rút gọn',
  INTERVIEW: 'Phỏng vấn',
  OFFER: 'Đề nghị (Offer)',
  HIRED: 'Đã tuyển',
  REJECTED: 'Đã từ chối',
  WITHDRAWN: 'Đã rút đơn',
};

/**
 * The line posted into a conversation when its application changes status.
 * Stored as plain text (like every message) — an unknown future status falls
 * back to its raw name rather than failing to post.
 */
export function applicationStatusChangedText(status: string): string {
  const label = APPLICATION_STATUS_LABEL[status] ?? status;
  return `Đơn ứng tuyển đã chuyển sang trạng thái "${label}".`;
}

/**
 * Deterministic idempotency key for that line. An application can only reach
 * a given status once (the pipeline never goes backwards), so this identifies
 * the transition: a redelivered event collides on the unique
 * (conversationId, clientMessageId) instead of posting the line twice.
 */
export function applicationStatusSystemMessageKey(
  applicationId: string,
  status: string,
): string {
  return `system:application-status:${applicationId}:${status}`;
}
