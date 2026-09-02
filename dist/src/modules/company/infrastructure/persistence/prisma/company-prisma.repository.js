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
exports.CompanyPrismaRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../../prisma/prisma.service");
let CompanyPrismaRepository = class CompanyPrismaRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(id) {
        return this.prisma.company.findFirst({
            where: { id, deletedAt: null },
        });
    }
    async findBySlug(slug) {
        return this.prisma.company.findFirst({
            where: { slug, deletedAt: null },
        });
    }
    async findByOwnerId(ownerId) {
        return this.prisma.company.findFirst({
            where: { ownerId, deletedAt: null },
        });
    }
    async existsBySlug(slug) {
        const company = await this.prisma.company.findUnique({
            where: { slug },
            select: { id: true },
        });
        return !!company;
    }
    async findAllPaginated(params) {
        const [companies, total] = await Promise.all([
            this.prisma.company.findMany({
                skip: params.skip,
                take: params.take,
                where: params.where,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.company.count({ where: params.where }),
        ]);
        return { companies, total };
    }
    async create(data) {
        return this.prisma.company.create({ data });
    }
    async update(id, data) {
        return this.prisma.company.update({
            where: { id },
            data,
        });
    }
    async delete(id) {
        return this.prisma.company.delete({ where: { id } });
    }
};
exports.CompanyPrismaRepository = CompanyPrismaRepository;
exports.CompanyPrismaRepository = CompanyPrismaRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CompanyPrismaRepository);
//# sourceMappingURL=company-prisma.repository.js.map