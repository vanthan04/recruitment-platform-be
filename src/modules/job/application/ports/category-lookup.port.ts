/**
 * Narrow port for what `job` needs from the `category` module — only an
 * existence check, not the full `ICategoryRepository` surface.
 */
export abstract class ICategoryLookupPort {
  abstract exists(categoryId: string): Promise<boolean>;
}
