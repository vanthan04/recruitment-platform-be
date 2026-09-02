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
exports.JobInfraRepository = void 0;
const common_1 = require("@nestjs/common");
const job_prisma_repository_1 = require("../persistence/prisma/job-prisma.repository");
const job_mapper_1 = require("../persistence/mappers/job.mapper");
let JobInfraRepository = class JobInfraRepository {
    jobPrisma;
    constructor(jobPrisma) {
        this.jobPrisma = jobPrisma;
    }
    async findById(id) {
        const raw = await this.jobPrisma.findById(id);
        return job_mapper_1.JobMapper.toDomain(raw);
    }
    async findAllPaginated(params) {
        const skip = (params.page - 1) * params.limit;
        const where = {
            deletedAt: null,
            status: 'OPEN',
        };
        if (params.keyword) {
            where.OR = [
                { title: { contains: params.keyword, mode: 'insensitive' } },
                { description: { contains: params.keyword, mode: 'insensitive' } },
                { company: { name: { contains: params.keyword, mode: 'insensitive' } } },
            ];
        }
        if (params.location) {
            where.location = { contains: params.location, mode: 'insensitive' };
        }
        if (params.jobType) {
            where.jobType = params.jobType;
        }
        if (params.salaryMin !== undefined) {
            where.salaryMax = { gte: params.salaryMin };
        }
        if (params.salaryMax !== undefined) {
            where.salaryMin = { lte: params.salaryMax };
        }
        if (params.companyId) {
            where.companyId = params.companyId;
        }
        if (params.categoryId) {
            where.categoryId = params.categoryId;
        }
        if (params.level) {
            where.level = params.level;
        }
        const { jobs: raws, total } = await this.jobPrisma.findAllPaginated({
            skip,
            take: params.limit,
            where,
        });
        return {
            jobs: raws.map((r) => job_mapper_1.JobMapper.toDomain(r)),
            total,
        };
    }
    async findAllByRecruiter(recruiterId) {
        const raws = await this.jobPrisma.findAllByRecruiter(recruiterId);
        return raws.map((r) => job_mapper_1.JobMapper.toDomain(r));
    }
    async findExpiredOpenJobs() {
        const raws = await this.jobPrisma.findExpiredOpen();
        return raws.map((r) => job_mapper_1.JobMapper.toDomain(r));
    }
    async save(job) {
        const data = job_mapper_1.JobMapper.toPersistence(job);
        const raw = await this.jobPrisma.create(data);
        return job_mapper_1.JobMapper.toDomain(raw);
    }
    async update(job) {
        const data = job_mapper_1.JobMapper.toPersistence(job);
        const raw = await this.jobPrisma.update(job.id, data);
        return job_mapper_1.JobMapper.toDomain(raw);
    }
    async delete(id) {
        await this.jobPrisma.delete(id);
    }
    async incrementViewCount(id) {
        await this.jobPrisma.incrementViewCount(id);
    }
};
exports.JobInfraRepository = JobInfraRepository;
exports.JobInfraRepository = JobInfraRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [job_prisma_repository_1.JobPrismaRepository])
], JobInfraRepository);
//# sourceMappingURL=job.infra-repository.js.map