import { ListMyNotificationsUseCase } from '@/modules/notification/application/use-cases/list-my-notifications.use-case';
import { MarkAsReadUseCase } from '@/modules/notification/application/use-cases/mark-as-read.use-case';
import { MarkAllAsReadUseCase } from '@/modules/notification/application/use-cases/mark-all-as-read.use-case';
import { ListNotificationsDto } from '@/modules/notification/presentation/dtos/list-notifications.dto';
export declare class NotificationController {
    private readonly listMyNotificationsUseCase;
    private readonly markAsReadUseCase;
    private readonly markAllAsReadUseCase;
    constructor(listMyNotificationsUseCase: ListMyNotificationsUseCase, markAsReadUseCase: MarkAsReadUseCase, markAllAsReadUseCase: MarkAllAsReadUseCase);
    list(userId: string, query: ListNotificationsDto): Promise<import("../../../../common/dtos/response.dto").ResponseDto<import("../../application/dto/notification-response.dto").NotificationResponseDto>>;
    markAsRead(userId: string, notificationId: string): Promise<import("../../../../common/dtos/response.dto").ResponseDto<import("../../application/dto/notification-response.dto").NotificationResponseDto>>;
    markAllAsRead(userId: string): Promise<import("../../../../common/dtos/response.dto").ResponseDto<null>>;
}
