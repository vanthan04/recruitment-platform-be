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
exports.CompanyInfraRepository = void 0;
const common_1 = require("@nestjs/common");
const company_prisma_repository_1 = require("../persistence/prisma/company-prisma.repository");
const company_mapper_1 = require("../persistence/mappers/company.mapper");
let CompanyInfraRepository = class CompanyInfraRepository {
    companyPrisma;
    constructor(companyPrisma) {
        this.companyPrisma = companyPrisma;
    }
    async findById(id) {
        const raw = await this.companyPrisma.findById(id);
        return company_mapper_1.CompanyMapper.toDomain(raw);
    }
    async findBySlug(slug) {
        const raw = await this.companyPrisma.findBySlug(slug);
        return company_mapper_1.CompanyMapper.toDomain(raw);
    }
    async findByOwnerId(ownerId) {
        const raw = await this.companyPrisma.findByOwnerId(ownerId);
        return company_mapper_1.CompanyMapper.toDomain(raw);
    }
    async existsBySlug(slug) {
        return this.companyPrisma.existsBySlug(slug);
    }
    async findAllPaginated(params) {
        const skip = (params.page - 1) * params.limit;
        const where = { deletedAt: null };
        if (params.keyword) {
            where.OR = [
                { name: { contains: params.keyword, mode: 'insensitive' } },
                { industry: { contains: params.keyword, mode: 'insensitive' } },
            ];
        }
        if (params.industry) {
            where.industry = { contains: params.industry, mode: 'insensitive' };
        }
        const { companies: raws, total } = await this.companyPrisma.findAllPaginated({
            skip,
            take: params.limit,
            where,
        });
        return {
            companies: raws.map((r) => company_mapper_1.CompanyMapper.toDomain(r)),
            total,
        };
    }
    async save(company) {
        const data = company_mapper_1.CompanyMapper.toPersistence(company);
        const raw = await this.companyPrisma.create(data);
        return company_mapper_1.CompanyMapper.toDomain(raw);
    }
    async update(company) {
        const data = company_mapper_1.CompanyMapper.toPersistence(company);
        const raw = await this.companyPrisma.update(company.id, data);
        return company_mapper_1.CompanyMapper.toDomain(raw);
    }
    async delete(id) {
        await this.companyPrisma.delete(id);
    }
};
exports.CompanyInfraRepository = CompanyInfraRepository;
exports.CompanyInfraRepository = CompanyInfraRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [company_prisma_repository_1.CompanyPrismaRepository])
], CompanyInfraRepository);
//# sourceMappingURL=company.infra-repository.js.map