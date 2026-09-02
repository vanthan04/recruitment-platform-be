export interface JobCompanySummary {
  id: string;
  name: string;
  logoUrl: string | null;
}

/**
 * Narrow port for what `job` needs from the `company` module — batch
 * summaries to attach to job entities, and a keyword→ids lookup so job
 * search can match on company name without a raw relational filter into
 * company's table.
 */
export abstract class ICompanyLookupPort {
  abstract findManyByIds(
    ids: string[],
  ): Promise<Map<string, JobCompanySummary>>;
  abstract searchIdsByKeyword(keyword: string): Promise<string[]>;
}
