/**
 * Narrow port for what `job` needs from the `user` module — just the
 * recruiter's linked company, not the full `IUserRepository` surface.
 */
export abstract class IUserLookupPort {
  abstract getRecruiterCompanyId(userId: string): Promise<string | null>;
}
