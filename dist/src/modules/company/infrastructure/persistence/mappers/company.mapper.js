"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanyMapper = void 0;
const company_entity_1 = require("../../../domain/entities/company.entity");
class CompanyMapper {
    static toDomain(raw) {
        if (!raw)
            return null;
        return new company_entity_1.Company({
            id: raw.id,
            name: raw.name,
            slug: raw.slug,
            logoUrl: raw.logoUrl,
            description: raw.description,
            website: raw.website,
            industry: raw.industry,
            size: raw.size,
            address: raw.address,
            ownerId: raw.ownerId,
            createdAt: raw.createdAt,
            updatedAt: raw.updatedAt,
            deletedAt: raw.deletedAt,
        });
    }
    static toPersistence(company) {
        return {
            name: company.name,
            slug: company.slug,
            logoUrl: company.logoUrl,
            description: company.description,
            website: company.website,
            industry: company.industry,
            size: company.size,
            address: company.address,
            ownerId: company.ownerId,
            deletedAt: company.deletedAt,
        };
    }
}
exports.CompanyMapper = CompanyMapper;
//# sourceMappingURL=company.mapper.js.map