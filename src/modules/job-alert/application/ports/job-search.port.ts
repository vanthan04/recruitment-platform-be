export interface JobDigestItem {
  title: string;
  location: string;
  companyName: string | null;
}

export interface JobSearchFilters {
  keyword?: string;
  location?: string;
  employmentType?: string;
  workMode?: string;
  categoryId?: string;
}

export interface JobDigestResult {
  /** Capped at the adapter's display limit — see `total` for the real match count. */
  items: JobDigestItem[];
  total: number;
}

export abstract class IJobSearchPort {
  abstract findRecentMatchingJobs(
    filters: JobSearchFilters,
    since: Date,
  ): Promise<JobDigestResult>;
}
