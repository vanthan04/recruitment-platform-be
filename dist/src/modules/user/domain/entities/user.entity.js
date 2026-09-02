"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const base_entity_1 = require("../../../../common/domain/base.entity");
class User extends base_entity_1.BaseEntity {
    email;
    password;
    verifyCode;
    role;
    status;
    companyId;
    profile;
    constructor(partial) {
        super();
        Object.assign(this, partial);
    }
}
exports.User = User;
//# sourceMappingURL=user.entity.js.map