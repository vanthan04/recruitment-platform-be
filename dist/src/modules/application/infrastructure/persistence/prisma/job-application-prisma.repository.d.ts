import { PrismaService } from '@/modules/prisma/prisma.service';
export declare class JobApplicationPrismaRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findById(id: string): Promise<{
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.ApplicationStatus;
        coverLetter: string | null;
        jobId: string;
        cvId: string;
    } | null>;
    findByUserIdAndJobId(userId: string, jobId: string): Promise<{
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.ApplicationStatus;
        coverLetter: string | null;
        jobId: string;
        cvId: string;
    } | null>;
    findAllByJobId(jobId: string): Promise<({
        user: {
            profile: {
                summary: string | null;
                fullName: string;
                birthDate: Date | null;
                gender: import("@prisma/client").$Enums.Gender | null;
                phoneNumber: string | null;
                avatarUrl: string | null;
                headline: string | null;
                userId: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            email: string;
            password: string;
            verifyCode: string | null;
            role: import("@prisma/client").$Enums.UserRole;
            status: import("@prisma/client").$Enums.UserStatus;
            companyId: string | null;
        };
        cv: {
            summary: string | null;
            userId: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.CvStatus;
            title: string;
            fileUrl: string | null;
            publishedAt: Date | null;
            deletedAt: Date | null;
        };
    } & {
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.ApplicationStatus;
        coverLetter: string | null;
        jobId: string;
        cvId: string;
    })[]>;
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
        updatedAt: Date;
        status: import("@prisma/client").$Enums.ApplicationStatus;
        coverLetter: string | null;
        jobId: string;
        cvId: string;
    })[]>;
    create(data: any): Promise<{
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.ApplicationStatus;
        coverLetter: string | null;
        jobId: string;
        cvId: string;
    }>;
    update(id: string, data: any): Promise<{
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.ApplicationStatus;
        coverLetter: string | null;
        jobId: string;
        cvId: string;
    }>;
    countByJobIdGroupedByStatus(jobId: string): Promise<(import("@prisma/client").Prisma.PickEnumerable<import("@prisma/client").Prisma.JobApplicationGroupByOutputType, "status"[]> & {
        _count: {
            _all: number;
        };
    })[]>;
}
