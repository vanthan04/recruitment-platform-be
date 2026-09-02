export interface JobCategorySummary {
  id: string;
  name: string;
  slug: string;
}

/**
 * Narrow port for what `job` needs from the `category` module — an
 * existence check (for write validation) and batch summaries (for read
 * enrichment), not the full `ICategoryRepository` surface.
 */
export abstract class ICategoryLookupPort {
  abstract exists(categoryId: string): Promise<boolean>;
  abstract findManyByIds(
    ids: string[],
  ): Promise<Map<string, JobCategorySummary>>;
}
