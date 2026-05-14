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
exports.CvInfraRepository = void 0;
const common_1 = require("@nestjs/common");
const cv_prisma_repository_1 = require("../persistence/prisma/cv-prisma.repository");
const cv_mapper_1 = require("../persistence/mappers/cv.mapper");
let CvInfraRepository = class CvInfraRepository {
    cvPrisma;
    constructor(cvPrisma) {
        this.cvPrisma = cvPrisma;
    }
    async findById(id) {
        const raw = await this.cvPrisma.findById(id);
        return cv_mapper_1.CvMapper.toDomain(raw);
    }
    async findByIdWithRelations(id) {
        const raw = await this.cvPrisma.findByIdWithRelations(id);
        return cv_mapper_1.CvMapper.toDomain(raw);
    }
    async findAllByUserId(userId) {
        const raws = await this.cvPrisma.findAllByUserId(userId);
        return raws.map((r) => cv_mapper_1.CvMapper.toDomain(r));
    }
    async save(cv) {
        const data = cv_mapper_1.CvMapper.toPersistence(cv);
        const createData = {
            ...data,
            experiences: {
                create: cv.experiences.map(cv_mapper_1.CvMapper.experienceToPersistence),
            },
            educations: {
                create: cv.educations.map(cv_mapper_1.CvMapper.educationToPersistence),
            },
            skills: {
                create: cv.skills.map(cv_mapper_1.CvMapper.skillToPersistence),
            },
        };
        const raw = await this.cvPrisma.create(createData);
        return cv_mapper_1.CvMapper.toDomain(raw);
    }
    async update(cv) {
        await Promise.all([
            this.cvPrisma.deleteExperiencesByCvId(cv.id),
            this.cvPrisma.deleteEducationsByCvId(cv.id),
            this.cvPrisma.deleteSkillsByCvId(cv.id),
        ]);
        const data = cv_mapper_1.CvMapper.toPersistence(cv);
        const updateData = {
            ...data,
            experiences: {
                create: cv.experiences.map(cv_mapper_1.CvMapper.experienceToPersistence),
            },
            educations: {
                create: cv.educations.map(cv_mapper_1.CvMapper.educationToPersistence),
            },
            skills: {
                create: cv.skills.map(cv_mapper_1.CvMapper.skillToPersistence),
            },
        };
        const raw = await this.cvPrisma.update(cv.id, updateData);
        return cv_mapper_1.CvMapper.toDomain(raw);
    }
    async delete(id) {
        await this.cvPrisma.hardDelete(id);
    }
    async softDelete(id) {
        await this.cvPrisma.softDelete(id);
    }
};
exports.CvInfraRepository = CvInfraRepository;
exports.CvInfraRepository = CvInfraRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [cv_prisma_repository_1.CvPrismaRepository])
], CvInfraRepository);
//# sourceMappingURL=cv.infra-repository.js.map