import { PrismaService } from '@/modules/prisma/prisma.service';
import { Prisma } from '@prisma/client';
export declare class CompanyPrismaRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findById(id: string): Promise<{
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        deletedAt: Date | null;
        slug: string;
        logoUrl: string | null;
        website: string | null;
        industry: string | null;
        size: import("@prisma/client").$Enums.CompanySize | null;
        address: string | null;
        ownerId: string;
    } | null>;
    findBySlug(slug: string): Promise<{
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        deletedAt: Date | null;
        slug: string;
        logoUrl: string | null;
        website: string | null;
        industry: string | null;
        size: import("@prisma/client").$Enums.CompanySize | null;
        address: string | null;
        ownerId: string;
    } | null>;
    findByOwnerId(ownerId: string): Promise<{
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        deletedAt: Date | null;
        slug: string;
        logoUrl: string | null;
        website: string | null;
        industry: string | null;
        size: import("@prisma/client").$Enums.CompanySize | null;
        address: string | null;
        ownerId: string;
    } | null>;
    existsBySlug(slug: string): Promise<boolean>;
    findAllPaginated(params: {
        skip: number;
        take: number;
        where: Prisma.CompanyWhereInput;
    }): Promise<{
        companies: {
            description: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            deletedAt: Date | null;
            slug: string;
            logoUrl: string | null;
            website: string | null;
            industry: string | null;
            size: import("@prisma/client").$Enums.CompanySize | null;
            address: string | null;
            ownerId: string;
        }[];
        total: number;
    }>;
    create(data: any): Promise<{
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        deletedAt: Date | null;
        slug: string;
        logoUrl: string | null;
        website: string | null;
        industry: string | null;
        size: import("@prisma/client").$Enums.CompanySize | null;
        address: string | null;
        ownerId: string;
    }>;
    update(id: string, data: any): Promise<{
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        deletedAt: Date | null;
        slug: string;
        logoUrl: string | null;
        website: string | null;
        industry: string | null;
        size: import("@prisma/client").$Enums.CompanySize | null;
        address: string | null;
        ownerId: string;
    }>;
    delete(id: string): Promise<{
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        deletedAt: Date | null;
        slug: string;
        logoUrl: string | null;
        website: string | null;
        industry: string | null;
        size: import("@prisma/client").$Enums.CompanySize | null;
        address: string | null;
        ownerId: string;
    }>;
}
