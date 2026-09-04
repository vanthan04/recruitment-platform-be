export class JobStatsResponseDto {
  jobId: string;
  viewCount: number;
  totalApplications: number;
  applied: number;
  screening: number;
  shortlisted: number;
  interview: number;
  offer: number;
  hired: number;
  rejected: number;
  withdrawn: number;
}
