/**
 * Job Response DTO — Application layer output.
 */
export class JobResponseDto {
  id: string;
  title: string;
  description: string;
  companyId: string;
  company: { id: string; name: string; logoUrl: string | null } | null;
  categoryId: string | null;
  category: { id: string; name: string; slug: string } | null;
  location: string;
  address: string | null;
  employmentType: string;
  workMode: string;
  level: string | null;
  status: string;
  viewCount: number;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  requirements: string[];
  benefits: string[];
  workingHours: string[];
  expiresAt: Date | null;
  postedById: string;
  skills: { id: string; name: string; slug: string }[];
  createdAt: Date;
  updatedAt: Date;
}
