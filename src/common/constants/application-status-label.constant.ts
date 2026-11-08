/**
 * Vietnamese labels for the application pipeline statuses — the wording the
 * frontend shows on a status badge (its APPLICATION_STATUS_LABEL), kept here
 * for the places the backend writes text a user will read: notifications and
 * in-chat status lines. Keeping one copy means those and the badge can't
 * drift apart.
 *
 * Keyed by plain string rather than the application module's enum so shared
 * code doesn't depend on a feature module; a test checks it still covers
 * every status in the pipeline.
 */
export const APPLICATION_STATUS_LABEL_VI: Readonly<Record<string, string>> = {
  APPLIED: 'Đã ứng tuyển',
  SCREENING: 'Đang sàng lọc',
  SHORTLISTED: 'Vào danh sách rút gọn',
  INTERVIEW: 'Phỏng vấn',
  OFFER: 'Đề nghị (Offer)',
  HIRED: 'Đã tuyển',
  REJECTED: 'Đã từ chối',
  WITHDRAWN: 'Đã rút đơn',
};

/** The label for a status, or the raw status for one that has no label yet — never throws. */
export function applicationStatusLabelVi(status: string): string {
  return APPLICATION_STATUS_LABEL_VI[status] ?? status;
}
