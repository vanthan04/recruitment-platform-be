"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseEntity = void 0;
const uuid_1 = require("uuid");
class BaseEntity {
    id = (0, uuid_1.v4)();
    createdAt = new Date();
    updatedAt = new Date();
}
exports.BaseEntity = BaseEntity;
//# sourceMappingURL=base.entity.js.map