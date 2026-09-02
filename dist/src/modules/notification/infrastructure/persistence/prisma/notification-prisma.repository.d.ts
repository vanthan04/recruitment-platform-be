import { PrismaService } from '@/modules/prisma/prisma.service';
export declare class NotificationPrismaRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findById(id: string): Promise<{
        message: string;
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
        userId: string;
        id: string;
        createdAt: Date;
        type: import("@prisma/client").$Enums.NotificationType;
        title: string;
        isRead: boolean;
    } | null>;
    findAllByUserPaginated(userId: string, skip: number, take: number): Promise<{
        notifications: {
            message: string;
            metadata: import("@prisma/client/runtime/client").JsonValue | null;
            userId: string;
            id: string;
            createdAt: Date;
            type: import("@prisma/client").$Enums.NotificationType;
            title: string;
            isRead: boolean;
        }[];
        total: number;
    }>;
    create(data: any): Promise<{
        message: string;
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
        userId: string;
        id: string;
        createdAt: Date;
        type: import("@prisma/client").$Enums.NotificationType;
        title: string;
        isRead: boolean;
    }>;
    update(id: string, data: any): Promise<{
        message: string;
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
        userId: string;
        id: string;
        createdAt: Date;
        type: import("@prisma/client").$Enums.NotificationType;
        title: string;
        isRead: boolean;
    }>;
    markAllAsRead(userId: string): Promise<void>;
}
