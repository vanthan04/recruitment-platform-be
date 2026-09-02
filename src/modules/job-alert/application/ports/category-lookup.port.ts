export abstract class ICategoryLookupPort {
  abstract exists(categoryId: string): Promise<boolean>;
}
