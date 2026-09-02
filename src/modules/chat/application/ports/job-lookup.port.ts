export interface ChatJobLookupResult {
  id: string;
  title: string;
  postedById: string;
  companyId: string;
}

export abstract class IChatJobLookupPort {
  abstract findById(jobId: string): Promise<ChatJobLookupResult | null>;
}
