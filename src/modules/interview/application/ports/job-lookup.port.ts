export interface InterviewJobLookupResult {
  id: string;
  title: string;
  postedById: string;
}

export abstract class IInterviewJobLookupPort {
  abstract findById(jobId: string): Promise<InterviewJobLookupResult | null>;
}
