import { PrismaService } from '@/modules/prisma/prisma.service';
export declare class CvPrismaRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findById(id: string): Promise<{
        summary: string | null;
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.CvStatus;
        title: string;
        publishedAt: Date | null;
        deletedAt: Date | null;
    } | null>;
    findByIdWithRelations(id: string): Promise<({
        experiences: {
            description: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            company: string;
            cvId: string;
            position: string;
            isCurrent: boolean;
            startDate: Date;
            endDate: Date | null;
        }[];
        educations: {
            description: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            cvId: string;
            school: string;
            degree: string;
            fieldOfStudy: string | null;
            startDate: Date;
            endDate: Date | null;
        }[];
        skills: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            cvId: string;
            level: string | null;
        }[];
    } & {
        summary: string | null;
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.CvStatus;
        title: string;
        publishedAt: Date | null;
        deletedAt: Date | null;
    }) | null>;
    findAllByUserId(userId: string): Promise<({
        experiences: {
            description: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            company: string;
            cvId: string;
            position: string;
            isCurrent: boolean;
            startDate: Date;
            endDate: Date | null;
        }[];
        educations: {
            description: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            cvId: string;
            school: string;
            degree: string;
            fieldOfStudy: string | null;
            startDate: Date;
            endDate: Date | null;
        }[];
        skills: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            cvId: string;
            level: string | null;
        }[];
    } & {
        summary: string | null;
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.CvStatus;
        title: string;
        publishedAt: Date | null;
        deletedAt: Date | null;
    })[]>;
    create(data: any): Promise<{
        experiences: {
            description: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            company: string;
            cvId: string;
            position: string;
            isCurrent: boolean;
            startDate: Date;
            endDate: Date | null;
        }[];
        educations: {
            description: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            cvId: string;
            school: string;
            degree: string;
            fieldOfStudy: string | null;
            startDate: Date;
            endDate: Date | null;
        }[];
        skills: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            cvId: string;
            level: string | null;
        }[];
    } & {
        summary: string | null;
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.CvStatus;
        title: string;
        publishedAt: Date | null;
        deletedAt: Date | null;
    }>;
    update(id: string, data: any): Promise<{
        experiences: {
            description: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            company: string;
            cvId: string;
            position: string;
            isCurrent: boolean;
            startDate: Date;
            endDate: Date | null;
        }[];
        educations: {
            description: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            cvId: string;
            school: string;
            degree: string;
            fieldOfStudy: string | null;
            startDate: Date;
            endDate: Date | null;
        }[];
        skills: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            cvId: string;
            level: string | null;
        }[];
    } & {
        summary: string | null;
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.CvStatus;
        title: string;
        publishedAt: Date | null;
        deletedAt: Date | null;
    }>;
    softDelete(id: string): Promise<{
        summary: string | null;
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.CvStatus;
        title: string;
        publishedAt: Date | null;
        deletedAt: Date | null;
    }>;
    hardDelete(id: string): Promise<{
        summary: string | null;
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.CvStatus;
        title: string;
        publishedAt: Date | null;
        deletedAt: Date | null;
    }>;
    deleteExperiencesByCvId(cvId: string): Promise<import("@prisma/client").Prisma.BatchPayload>;
    deleteEducationsByCvId(cvId: string): Promise<import("@prisma/client").Prisma.BatchPayload>;
    deleteSkillsByCvId(cvId: string): Promise<import("@prisma/client").Prisma.BatchPayload>;
}
