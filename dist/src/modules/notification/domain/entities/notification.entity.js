"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notification = void 0;
const base_entity_1 = require("../../../../common/domain/base.entity");
const domain_exception_1 = require("../../../../common/exceptions/domain.exception");
class Notification extends base_entity_1.BaseEntity {
    userId;
    type;
    title;
    message;
    isRead;
    metadata;
    constructor(partial) {
        super();
        Object.assign(this, partial);
        this.isRead = partial.isRead ?? false;
        this.metadata = partial.metadata ?? null;
    }
    markAsRead() {
        if (this.isRead) {
            throw new domain_exception_1.BusinessRuleViolationException('Notification is already read');
        }
        this.isRead = true;
    }
}
exports.Notification = Notification;
//# sourceMappingURL=notification.entity.js.map