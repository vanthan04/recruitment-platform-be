export interface ApplicationUserLookupResult {
  id: string;
  fullName: string;
  avatarUrl: string | null;
}

/**
 * Narrow port for what `application` needs from the `user` module — just
 * enough to show "who applied" on the recruiter's application list.
 */
export abstract class IApplicationUserLookupPort {
  abstract findById(
    userId: string,
  ): Promise<ApplicationUserLookupResult | null>;
  /** One batched lookup instead of N — used by the recruiter's "applications for this job" list. */
  abstract findManyByIds(
    userIds: string[],
  ): Promise<Map<string, ApplicationUserLookupResult>>;
}
