"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationResponseMapper = void 0;
const notification_response_dto_1 = require("../dto/notification-response.dto");
class NotificationResponseMapper {
    static toDto(notification) {
        const dto = new notification_response_dto_1.NotificationResponseDto();
        dto.id = notification.id;
        dto.type = notification.type;
        dto.title = notification.title;
        dto.message = notification.message;
        dto.isRead = notification.isRead;
        dto.metadata = notification.metadata;
        dto.createdAt = notification.createdAt;
        return dto;
    }
    static toDtoList(notifications) {
        return notifications.map(NotificationResponseMapper.toDto);
    }
}
exports.NotificationResponseMapper = NotificationResponseMapper;
//# sourceMappingURL=notification-response.mapper.js.map