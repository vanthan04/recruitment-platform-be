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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListMyNotificationsUseCase = void 0;
const common_1 = require("@nestjs/common");
const notification_repository_1 = require("../../domain/repositories/notification.repository");
const notification_response_mapper_1 = require("../mappers/notification-response.mapper");
let ListMyNotificationsUseCase = class ListMyNotificationsUseCase {
    notificationRepository;
    constructor(notificationRepository) {
        this.notificationRepository = notificationRepository;
    }
    async execute(userId, page, limit) {
        const { notifications, total } = await this.notificationRepository.findAllByUserPaginated(userId, page, limit);
        return {
            notifications: notification_response_mapper_1.NotificationResponseMapper.toDtoList(notifications),
            total,
            page,
            limit,
        };
    }
};
exports.ListMyNotificationsUseCase = ListMyNotificationsUseCase;
exports.ListMyNotificationsUseCase = ListMyNotificationsUseCase = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [notification_repository_1.INotificationRepository])
], ListMyNotificationsUseCase);
//# sourceMappingURL=list-my-notifications.use-case.js.map