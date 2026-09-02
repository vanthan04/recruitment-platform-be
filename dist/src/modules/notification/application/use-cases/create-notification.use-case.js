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
exports.CreateNotificationUseCase = void 0;
const common_1 = require("@nestjs/common");
const notification_repository_1 = require("../../domain/repositories/notification.repository");
const notification_entity_1 = require("../../domain/entities/notification.entity");
let CreateNotificationUseCase = class CreateNotificationUseCase {
    notificationRepository;
    constructor(notificationRepository) {
        this.notificationRepository = notificationRepository;
    }
    async execute(input) {
        const notification = new notification_entity_1.Notification({
            userId: input.userId,
            type: input.type,
            title: input.title,
            message: input.message,
            metadata: input.metadata ?? null,
        });
        await this.notificationRepository.save(notification);
    }
};
exports.CreateNotificationUseCase = CreateNotificationUseCase;
exports.CreateNotificationUseCase = CreateNotificationUseCase = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [notification_repository_1.INotificationRepository])
], CreateNotificationUseCase);
//# sourceMappingURL=create-notification.use-case.js.map