export interface JobLookupResult {
  id: string;
  title: string;
  postedById: string;
  isOpen: boolean;
  isExpired: boolean;
  isDeleted: boolean;
  viewCount: number;
}

export abstract class IJobLookupPort {
  abstract findById(jobId: string): Promise<JobLookupResult | null>;
}
