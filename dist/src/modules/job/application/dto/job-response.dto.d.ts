export declare class JobResponseDto {
    id: string;
    title: string;
    description: string;
    company: string;
    location: string;
    jobType: string;
    status: string;
    salaryMin: number | null;
    salaryMax: number | null;
    currency: string;
    requirements: string | null;
    benefits: string | null;
    expiresAt: Date | null;
    postedById: string;
    createdAt: Date;
    updatedAt: Date;
}
