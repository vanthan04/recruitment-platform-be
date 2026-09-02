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
exports.JobApplicationPrismaRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../../prisma/prisma.service");
let JobApplicationPrismaRepository = class JobApplicationPrismaRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(id) {
        return this.prisma.jobApplication.findUnique({
            where: { id },
        });
    }
    async findByUserIdAndJobId(userId, jobId) {
        return this.prisma.jobApplication.findUnique({
            where: {
                userId_jobId: { userId, jobId },
            },
        });
    }
    async findAllByJobId(jobId) {
        return this.prisma.jobApplication.findMany({
            where: { jobId },
            include: {
                user: { include: { profile: true } },
                cv: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findAllByUserId(userId) {
        return this.prisma.jobApplication.findMany({
            where: { userId },
            include: {
                job: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async create(data) {
        return this.prisma.jobApplication.create({ data });
    }
    async update(id, data) {
        return this.prisma.jobApplication.update({
            where: { id },
            data,
        });
    }
    async countByJobIdGroupedByStatus(jobId) {
        return this.prisma.jobApplication.groupBy({
            by: ['status'],
            where: { jobId },
            _count: { _all: true },
        });
    }
};
exports.JobApplicationPrismaRepository = JobApplicationPrismaRepository;
exports.JobApplicationPrismaRepository = JobApplicationPrismaRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], JobApplicationPrismaRepository);
//# sourceMappingURL=job-application-prisma.repository.js.map