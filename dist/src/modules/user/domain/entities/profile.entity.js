"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Profile = void 0;
const base_entity_1 = require("../../../../common/domain/base.entity");
class Profile extends base_entity_1.BaseEntity {
    fullName;
    birthDate;
    gender;
    phoneNumber;
    avatarUrl;
    headline;
    summary;
    userId;
    constructor(partial) {
        super();
        Object.assign(this, partial);
    }
}
exports.Profile = Profile;
//# sourceMappingURL=profile.entity.js.map