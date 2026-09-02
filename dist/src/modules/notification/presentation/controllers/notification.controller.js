"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../../auth/presentation/security/guards/jwt-auth.guard");
const get_me_decorator_1 = require("../../../../common/decorators/get-me.decorator");
const api_response_1 = require("../../../../common/dtos/api-response");
const list_my_notifications_use_case_1 = require("../../application/use-cases/list-my-notifications.use-case");
const mark_as_read_use_case_1 = require("../../application/use-cases/mark-as-read.use-case");
const mark_all_as_read_use_case_1 = require("../../application/use-cases/mark-all-as-read.use-case");
const list_notifications_dto_1 = require("../dtos/list-notifications.dto");
let NotificationController = class NotificationController {
    listMyNotificationsUseCase;
    markAsReadUseCase;
    markAllAsReadUseCase;
    constructor(listMyNotificationsUseCase, markAsReadUseCase, markAllAsReadUseCase) {
        this.listMyNotificationsUseCase = listMyNotificationsUseCase;
        this.markAsReadUseCase = markAsReadUseCase;
        this.markAllAsReadUseCase = markAllAsReadUseCase;
    }
    async list(userId, query) {
        const result = await this.listMyNotificationsUseCase.execute(userId, query.page ?? 1, query.limit ?? 10);
        return api_response_1.ApiResponse.ok(result.notifications, 'Notifications retrieved successfully', {
            total: result.total,
            page: result.page,
            limit: result.limit,
        });
    }
    async markAsRead(userId, notificationId) {
        const result = await this.markAsReadUseCase.execute(userId, notificationId);
        return api_response_1.ApiResponse.ok(result, 'Notification marked as read');
    }
    async markAllAsRead(userId) {
        await this.markAllAsReadUseCase.execute(userId);
        return api_response_1.ApiResponse.ok(null, 'All notifications marked as read');
    }
};
exports.NotificationController = NotificationController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List my notifications' }),
    __param(0, (0, get_me_decorator_1.GetMe)('id')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, list_notifications_dto_1.ListNotificationsDto]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "list", null);
__decorate([
    (0, common_1.Patch)(':id/read'),
    (0, swagger_1.ApiOperation)({ summary: 'Mark one notification as read' }),
    __param(0, (0, get_me_decorator_1.GetMe)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "markAsRead", null);
__decorate([
    (0, common_1.Patch)('read-all'),
    (0, swagger_1.ApiOperation)({ summary: 'Mark all my notifications as read' }),
    __param(0, (0, get_me_decorator_1.GetMe)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "markAllAsRead", null);
exports.NotificationController = NotificationController = __decorate([
    (0, swagger_1.ApiTags)('notifications'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('notifications'),
    __metadata("design:paramtypes", [list_my_notifications_use_case_1.ListMyNotificationsUseCase,
        mark_as_read_use_case_1.MarkAsReadUseCase,
        mark_all_as_read_use_case_1.MarkAllAsReadUseCase])
], NotificationController);
//# sourceMappingURL=notification.controller.js.map