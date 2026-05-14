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
exports.JobApplicationInfraRepository = void 0;
const common_1 = require("@nestjs/common");
const job_application_prisma_repository_1 = require("../persistence/prisma/job-application-prisma.repository");
const job_application_mapper_1 = require("../persistence/mappers/job-application.mapper");
let JobApplicationInfraRepository = class JobApplicationInfraRepository {
    applicationPrisma;
    constructor(applicationPrisma) {
        this.applicationPrisma = applicationPrisma;
    }
    async findById(id) {
        const raw = await this.applicationPrisma.findById(id);
        return job_application_mapper_1.JobApplicationMapper.toDomain(raw);
    }
    async findByUserIdAndJobId(userId, jobId) {
        const raw = await this.applicationPrisma.findByUserIdAndJobId(userId, jobId);
        return job_application_mapper_1.JobApplicationMapper.toDomain(raw);
    }
    async findAllByJobId(jobId) {
        const raws = await this.applicationPrisma.findAllByJobId(jobId);
        return raws.map((r) => job_application_mapper_1.JobApplicationMapper.toDomain(r));
    }
    async findAllByUserId(userId) {
        const raws = await this.applicationPrisma.findAllByUserId(userId);
        return raws.map((r) => job_application_mapper_1.JobApplicationMapper.toDomain(r));
    }
    async save(application) {
        const data = job_application_mapper_1.JobApplicationMapper.toPersistence(application);
        const raw = await this.applicationPrisma.create(data);
        return job_application_mapper_1.JobApplicationMapper.toDomain(raw);
    }
    async update(application) {
        const data = job_application_mapper_1.JobApplicationMapper.toPersistence(application);
        const raw = await this.applicationPrisma.update(application.id, data);
        return job_application_mapper_1.JobApplicationMapper.toDomain(raw);
    }
};
exports.JobApplicationInfraRepository = JobApplicationInfraRepository;
exports.JobApplicationInfraRepository = JobApplicationInfraRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [job_application_prisma_repository_1.JobApplicationPrismaRepository])
], JobApplicationInfraRepository);
//# sourceMappingURL=job-application.infra-repository.js.map