import { PrismaService } from '@/modules/prisma/prisma.service';
export declare class BookmarkPrismaRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findByUserIdAndJobId(userId: string, jobId: string): Promise<{
        userId: string;
        id: string;
        createdAt: Date;
        jobId: string;
    } | null>;
    findAllByUserId(userId: string): Promise<({
        job: {
            description: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.JobStatus;
            companyId: string;
            title: string;
            deletedAt: Date | null;
            location: string;
            jobType: import("@prisma/client").$Enums.JobType;
            level: import("@prisma/client").$Enums.JobLevel | null;
            viewCount: number;
            salaryMin: number | null;
            salaryMax: number | null;
            currency: string;
            requirements: string | null;
            benefits: string | null;
            expiresAt: Date | null;
            postedById: string;
            categoryId: string | null;
        };
    } & {
        userId: string;
        id: string;
        createdAt: Date;
        jobId: string;
    })[]>;
    create(data: any): Promise<{
        userId: string;
        id: string;
        createdAt: Date;
        jobId: string;
    }>;
    delete(userId: string, jobId: string): Promise<{
        userId: string;
        id: string;
        createdAt: Date;
        jobId: string;
    }>;
}
