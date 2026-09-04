/**
 * Work Mode value object — separate from EmploymentType so a job can be,
 * e.g., FULL_TIME + REMOTE at the same time (the old combined JobType
 * enum couldn't represent that).
 * Framework-agnostic.
 */
export enum WorkMode {
  ONSITE = 'ONSITE',
  HYBRID = 'HYBRID',
  REMOTE = 'REMOTE',
}
