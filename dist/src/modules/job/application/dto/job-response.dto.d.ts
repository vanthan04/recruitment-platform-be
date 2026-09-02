export declare class JobResponseDto {
    id: string;
    title: string;
    description: string;
    companyId: string;
    company: {
        id: string;
        name: string;
        logoUrl: string | null;
    } | null;
    categoryId: string | null;
    category: {
        id: string;
        name: string;
        slug: string;
    } | null;
    location: string;
    jobType: string;
    level: string | null;
    status: string;
    viewCount: number;
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
