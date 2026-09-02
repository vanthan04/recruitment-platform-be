export interface ChatApplicationLookupResult {
  id: string;
  status: string;
  userId: string;
  jobId: string;
}

export abstract class IChatApplicationLookupPort {
  abstract findById(
    applicationId: string,
  ): Promise<ChatApplicationLookupResult | null>;
}
