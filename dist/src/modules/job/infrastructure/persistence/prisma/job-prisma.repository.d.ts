import { PrismaService } from '@/modules/prisma/prisma.service';
import { Prisma } from '@prisma/client';
export declare class JobPrismaRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private readonly companySelect;
    private readonly categorySelect;
    private readonly relationIncludes;
    findById(id: string): Promise<({
        company: {
            id: string;
            name: string;
            logoUrl: string | null;
        };
        category: {
            id: string;
            name: string;
            slug: string;
        } | null;
    } & {
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
    }) | null>;
    findAllPaginated(params: {
        skip: number;
        take: number;
        where: Prisma.JobWhereInput;
        orderBy?: Prisma.JobOrderByWithRelationInput;
    }): Promise<{
        jobs: ({
            company: {
                id: string;
                name: string;
                logoUrl: string | null;
            };
            category: {
                id: string;
                name: string;
                slug: string;
            } | null;
        } & {
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
        })[];
        total: number;
    }>;
    findAllByRecruiter(recruiterId: string): Promise<({
        company: {
            id: string;
            name: string;
            logoUrl: string | null;
        };
        category: {
            id: string;
            name: string;
            slug: string;
        } | null;
    } & {
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
    })[]>;
    findExpiredOpen(): Promise<{
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
    }[]>;
    create(data: any): Promise<{
        company: {
            id: string;
            name: string;
            logoUrl: string | null;
        };
        category: {
            id: string;
            name: string;
            slug: string;
        } | null;
    } & {
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
    }>;
    update(id: string, data: any): Promise<{
        company: {
            id: string;
            name: string;
            logoUrl: string | null;
        };
        category: {
            id: string;
            name: string;
            slug: string;
        } | null;
    } & {
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
    }>;
    delete(id: string): Promise<{
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
    }>;
    incrementViewCount(id: string): Promise<void>;
}
