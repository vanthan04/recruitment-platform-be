export interface CvLookupResult {
  id: string;
  userId: string;
  isPublished: boolean;
  isDeleted: boolean;
}

export abstract class ICvLookupPort {
  abstract findById(cvId: string): Promise<CvLookupResult | null>;
}
