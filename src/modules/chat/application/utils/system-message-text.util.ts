import { applicationStatusLabelVi } from '@/common/constants/application-status-label.constant';

/**
 * The line posted into a conversation when its application changes status.
 * The label is the one the status badge shows (shared with notifications, so
 * they never disagree). Stored as plain text like every message — an unknown
 * future status falls back to its raw name rather than failing to post.
 */
export function applicationStatusChangedText(status: string): string {
  return `Đơn ứng tuyển đã chuyển sang trạng thái "${applicationStatusLabelVi(status)}".`;
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
