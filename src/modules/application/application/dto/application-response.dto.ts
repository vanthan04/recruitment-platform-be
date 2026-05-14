export class ApplicationResponseDto {
  id: string;
  status: string;
  coverLetter: string | null;
  userId: string;
  jobId: string;
  cvId: string;
  createdAt: Date;
  updatedAt: Date;
  // Optional relations for richness
  job?: any;
  cv?: any;
}
