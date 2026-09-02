"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserMapper = void 0;
const user_entity_1 = require("../../../domain/entities/user.entity");
const profile_mapper_1 = require("./profile.mapper");
class UserMapper {
    static toDomain(raw) {
        if (!raw)
            return null;
        return new user_entity_1.User({
            id: raw.id,
            email: raw.email,
            password: raw.password,
            verifyCode: raw.verifyCode || undefined,
            role: raw.role,
            status: raw.status,
            companyId: raw.companyId ?? null,
            profile: raw.profile ? profile_mapper_1.ProfileMapper.toDomain(raw.profile) : undefined,
            createdAt: raw.createdAt,
            updatedAt: raw.updatedAt,
        });
    }
}
exports.UserMapper = UserMapper;
//# sourceMappingURL=user.mapper.js.map