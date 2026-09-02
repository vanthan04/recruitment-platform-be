import { PrismaService } from '@/modules/prisma/prisma.service';
export declare class SavedSearchPrismaRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findById(id: string): Promise<{
        userId: string;
        id: string;
        createdAt: Date;
        location: string | null;
        jobType: import("@prisma/client").$Enums.JobType | null;
        categoryId: string | null;
        keyword: string | null;
    } | null>;
    findAllByUserId(userId: string): Promise<{
        userId: string;
        id: string;
        createdAt: Date;
        location: string | null;
        jobType: import("@prisma/client").$Enums.JobType | null;
        categoryId: string | null;
        keyword: string | null;
    }[]>;
    findAll(): Promise<{
        userId: string;
        id: string;
        createdAt: Date;
        location: string | null;
        jobType: import("@prisma/client").$Enums.JobType | null;
        categoryId: string | null;
        keyword: string | null;
    }[]>;
    create(data: any): Promise<{
        userId: string;
        id: string;
        createdAt: Date;
        location: string | null;
        jobType: import("@prisma/client").$Enums.JobType | null;
        categoryId: string | null;
        keyword: string | null;
    }>;
    delete(id: string): Promise<{
        userId: string;
        id: string;
        createdAt: Date;
        location: string | null;
        jobType: import("@prisma/client").$Enums.JobType | null;
        categoryId: string | null;
        keyword: string | null;
    }>;
}
