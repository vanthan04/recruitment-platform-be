export interface InterviewApplicationLookupResult {
  id: string;
  userId: string;
  jobId: string;
  status: string;
}

export abstract class IInterviewApplicationLookupPort {
  abstract findById(applicationId: string): Promise<InterviewApplicationLookupResult | null>;
}
