/**
 * Job list sort option — a query concern (not a persisted Job attribute),
 * but kept alongside the other job value objects since both the query
 * layer and the presentation DTO import it, matching how JobType/JobLevel
 * are shared across layers in this module.
 */
export enum JobSortOption {
  NEWEST = 'newest',
  SALARY_DESC = 'salary_desc',
  VIEWS_DESC = 'views_desc',
}
