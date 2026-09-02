"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanyResponseMapper = void 0;
const company_response_dto_1 = require("../dto/company-response.dto");
class CompanyResponseMapper {
    static toDto(company) {
        const dto = new company_response_dto_1.CompanyResponseDto();
        dto.id = company.id;
        dto.name = company.name;
        dto.slug = company.slug;
        dto.logoUrl = company.logoUrl;
        dto.description = company.description;
        dto.website = company.website;
        dto.industry = company.industry;
        dto.size = company.size;
        dto.address = company.address;
        dto.ownerId = company.ownerId;
        dto.createdAt = company.createdAt;
        dto.updatedAt = company.updatedAt;
        return dto;
    }
    static toDtoList(companies) {
        return companies.map(CompanyResponseMapper.toDto);
    }
}
exports.CompanyResponseMapper = CompanyResponseMapper;
//# sourceMappingURL=company-response.mapper.js.map