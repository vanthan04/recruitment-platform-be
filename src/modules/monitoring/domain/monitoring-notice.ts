/**
 * The monitoring notice version the backend currently accepts consent for.
 * Must match MONITORING_NOTICE_VERSION in recruitment-platform-fe
 * (src/lib/types/monitoring.ts). Bump both whenever the notice text or what
 * happens to the data changes; a client still showing an older notice is
 * refused at monitor:start, so nobody is monitored under terms they weren't shown.
 *
 * - 2026-11-09.v1: results shown to the candidate only, nothing stored.
 * - 2026-11-09.v2: observation events (type, time, confidence — no images)
 *   are stored and visible to the job's recruiter and to the candidate.
 */
export const CURRENT_MONITORING_NOTICE_VERSION = '2026-11-09.v2';
