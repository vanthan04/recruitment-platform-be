/**
 * Narrow port for what `bookmark` needs from the `job` module — only an
 * existence check, not the full `IJobRepository` surface.
 */
export abstract class IJobLookupPort {
  abstract exists(jobId: string): Promise<boolean>;
}
