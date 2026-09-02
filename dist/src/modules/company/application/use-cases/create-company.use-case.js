"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateCompanyUseCase = void 0;
const common_1 = require("@nestjs/common");
const company_repository_1 = require("../../domain/repositories/company.repository");
const company_entity_1 = require("../../domain/entities/company.entity");
const user_repository_1 = require("../../../user/domain/repositories/user.repository");
const domain_exception_1 = require("../../../../common/exceptions/domain.exception");
const company_response_mapper_1 = require("../mappers/company-response.mapper");
let CreateCompanyUseCase = class CreateCompanyUseCase {
    companyRepository;
    userRepository;
    constructor(companyRepository, userRepository) {
        this.companyRepository = companyRepository;
        this.userRepository = userRepository;
    }
    async execute(ownerId, input) {
        const existing = await this.companyRepository.findByOwnerId(ownerId);
        if (existing) {
            throw new domain_exception_1.DuplicateEntityException('Company', 'owner');
        }
        const slug = await this.generateUniqueSlug(input.name);
        const company = new company_entity_1.Company({
            name: input.name,
            slug,
            logoUrl: input.logoUrl ?? null,
            description: input.description ?? null,
            website: input.website ?? null,
            industry: input.industry ?? null,
            size: input.size ?? null,
            address: input.address ?? null,
            ownerId,
        });
        const saved = await this.companyRepository.save(company);
        await this.userRepository.updateCompanyId(ownerId, saved.id);
        return company_response_mapper_1.CompanyResponseMapper.toDto(saved);
    }
    async generateUniqueSlug(name) {
        const base = name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[̀-ͯ]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        let slug = base;
        let suffix = 1;
        while (await this.companyRepository.existsBySlug(slug)) {
            slug = `${base}-${++suffix}`;
        }
        return slug;
    }
};
exports.CreateCompanyUseCase = CreateCompanyUseCase;
exports.CreateCompanyUseCase = CreateCompanyUseCase = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [company_repository_1.ICompanyRepository,
        user_repository_1.IUserRepository])
], CreateCompanyUseCase);
//# sourceMappingURL=create-company.use-case.js.map