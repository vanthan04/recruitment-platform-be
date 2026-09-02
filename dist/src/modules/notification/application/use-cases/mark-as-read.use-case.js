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
exports.MarkAsReadUseCase = void 0;
const common_1 = require("@nestjs/common");
const notification_repository_1 = require("../../domain/repositories/notification.repository");
const domain_exception_1 = require("../../../../common/exceptions/domain.exception");
const notification_response_mapper_1 = require("../mappers/notification-response.mapper");
let MarkAsReadUseCase = class MarkAsReadUseCase {
    notificationRepository;
    constructor(notificationRepository) {
        this.notificationRepository = notificationRepository;
    }
    async execute(userId, notificationId) {
        const notification = await this.notificationRepository.findById(notificationId);
        if (!notification || notification.userId !== userId) {
            throw new domain_exception_1.EntityNotFoundException('Notification', notificationId);
        }
        notification.markAsRead();
        const updated = await this.notificationRepository.update(notification);
        return notification_response_mapper_1.NotificationResponseMapper.toDto(updated);
    }
};
exports.MarkAsReadUseCase = MarkAsReadUseCase;
exports.MarkAsReadUseCase = MarkAsReadUseCase = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [notification_repository_1.INotificationRepository])
], MarkAsReadUseCase);
//# sourceMappingURL=mark-as-read.use-case.js.map