"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationMapper = void 0;
const notification_entity_1 = require("../../../domain/entities/notification.entity");
class NotificationMapper {
    static toDomain(raw) {
        if (!raw)
            return null;
        return new notification_entity_1.Notification({
            id: raw.id,
            userId: raw.userId,
            type: raw.type,
            title: raw.title,
            message: raw.message,
            isRead: raw.isRead,
            metadata: raw.metadata,
            createdAt: raw.createdAt,
        });
    }
    static toPersistence(notification) {
        return {
            userId: notification.userId,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            isRead: notification.isRead,
            metadata: notification.metadata ?? undefined,
        };
    }
}
exports.NotificationMapper = NotificationMapper;
//# sourceMappingURL=notification.mapper.js.map