export interface JobSkillSummary {
  id: string;
  name: string;
  slug: string;
}

/**
 * Narrow port for what `job` needs from the `skill` module — a batch
 * existence check (for write validation) and batch summaries (for read
 * enrichment), not the full `ISkillRepository` surface.
 */
export abstract class ISkillLookupPort {
  abstract findManyByIds(ids: string[]): Promise<Map<string, JobSkillSummary>>;
}
