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
exports.CvPrismaRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../../prisma/prisma.service");
let CvPrismaRepository = class CvPrismaRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(id) {
        return this.prisma.cv.findFirst({
            where: { id, deletedAt: null },
        });
    }
    async findByIdWithRelations(id) {
        return this.prisma.cv.findFirst({
            where: { id, deletedAt: null },
            include: {
                experiences: { orderBy: { startDate: 'desc' } },
                educations: { orderBy: { startDate: 'desc' } },
                skills: { orderBy: { name: 'asc' } },
            },
        });
    }
    async findAllByUserId(userId) {
        return this.prisma.cv.findMany({
            where: { userId, deletedAt: null },
            include: {
                experiences: { orderBy: { startDate: 'desc' } },
                educations: { orderBy: { startDate: 'desc' } },
                skills: { orderBy: { name: 'asc' } },
            },
            orderBy: { updatedAt: 'desc' },
        });
    }
    async create(data) {
        return this.prisma.cv.create({
            data,
            include: {
                experiences: true,
                educations: true,
                skills: true,
            },
        });
    }
    async update(id, data) {
        return this.prisma.cv.update({
            where: { id },
            data,
            include: {
                experiences: true,
                educations: true,
                skills: true,
            },
        });
    }
    async softDelete(id) {
        return this.prisma.cv.update({
            where: { id },
            data: { deletedAt: new Date(), status: 'DRAFT' },
        });
    }
    async hardDelete(id) {
        return this.prisma.cv.delete({ where: { id } });
    }
    async deleteExperiencesByCvId(cvId) {
        return this.prisma.experience.deleteMany({ where: { cvId } });
    }
    async deleteEducationsByCvId(cvId) {
        return this.prisma.education.deleteMany({ where: { cvId } });
    }
    async deleteSkillsByCvId(cvId) {
        return this.prisma.skill.deleteMany({ where: { cvId } });
    }
};
exports.CvPrismaRepository = CvPrismaRepository;
exports.CvPrismaRepository = CvPrismaRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CvPrismaRepository);
//# sourceMappingURL=cv-prisma.repository.js.map