"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileMapper = void 0;
const profile_entity_1 = require("../../../domain/entities/profile.entity");
class ProfileMapper {
    static toDomain(raw) {
        if (!raw)
            return null;
        return new profile_entity_1.Profile({
            id: raw.id,
            fullName: raw.fullName,
            headline: raw.headline,
            summary: raw.summary,
            birthDate: raw.birthDate,
            gender: raw.gender,
            phoneNumber: raw.phoneNumber,
            avatarUrl: raw.avatarUrl,
            userId: raw.userId,
            createdAt: raw.createdAt,
            updatedAt: raw.updatedAt,
        });
    }
}
exports.ProfileMapper = ProfileMapper;
//# sourceMappingURL=profile.mapper.js.map