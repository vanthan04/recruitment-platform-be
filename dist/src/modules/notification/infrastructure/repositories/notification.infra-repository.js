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
exports.NotificationInfraRepository = void 0;
const common_1 = require("@nestjs/common");
const notification_prisma_repository_1 = require("../persistence/prisma/notification-prisma.repository");
const notification_mapper_1 = require("../persistence/mappers/notification.mapper");
let NotificationInfraRepository = class NotificationInfraRepository {
    notificationPrisma;
    constructor(notificationPrisma) {
        this.notificationPrisma = notificationPrisma;
    }
    async findById(id) {
        const raw = await this.notificationPrisma.findById(id);
        return notification_mapper_1.NotificationMapper.toDomain(raw);
    }
    async findAllByUserPaginated(userId, page, limit) {
        const skip = (page - 1) * limit;
        const { notifications: raws, total } = await this.notificationPrisma.findAllByUserPaginated(userId, skip, limit);
        return {
            notifications: raws.map((r) => notification_mapper_1.NotificationMapper.toDomain(r)),
            total,
        };
    }
    async save(notification) {
        const data = notification_mapper_1.NotificationMapper.toPersistence(notification);
        const raw = await this.notificationPrisma.create(data);
        return notification_mapper_1.NotificationMapper.toDomain(raw);
    }
    async update(notification) {
        const data = notification_mapper_1.NotificationMapper.toPersistence(notification);
        const raw = await this.notificationPrisma.update(notification.id, data);
        return notification_mapper_1.NotificationMapper.toDomain(raw);
    }
    async markAllAsRead(userId) {
        await this.notificationPrisma.markAllAsRead(userId);
    }
};
exports.NotificationInfraRepository = NotificationInfraRepository;
exports.NotificationInfraRepository = NotificationInfraRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [notification_prisma_repository_1.NotificationPrismaRepository])
], NotificationInfraRepository);
//# sourceMappingURL=notification.infra-repository.js.map