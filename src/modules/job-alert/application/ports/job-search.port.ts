export interface JobDigestItem {
  title: string;
  location: string;
  companyName: string | null;
}

export interface JobSearchFilters {
  keyword?: string;
  location?: string;
  jobType?: string;
  categoryId?: string;
}

export abstract class IJobSearchPort {
  abstract findRecentMatchingJobs(filters: JobSearchFilters, since: Date): Promise<JobDigestItem[]>;
}
