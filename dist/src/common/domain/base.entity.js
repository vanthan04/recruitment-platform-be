"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseEntity = void 0;
const crypto_1 = require("crypto");
class BaseEntity {
    id = (0, crypto_1.randomUUID)();
    createdAt = new Date();
    updatedAt = new Date();
}
exports.BaseEntity = BaseEntity;
//# sourceMappingURL=base.entity.js.map