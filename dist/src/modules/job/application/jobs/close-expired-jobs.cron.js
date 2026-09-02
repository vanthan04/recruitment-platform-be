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
var CloseExpiredJobsCron_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloseExpiredJobsCron = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const job_repository_1 = require("../../domain/repositories/job.repository");
let CloseExpiredJobsCron = CloseExpiredJobsCron_1 = class CloseExpiredJobsCron {
    jobRepository;
    logger = new common_1.Logger(CloseExpiredJobsCron_1.name);
    constructor(jobRepository) {
        this.jobRepository = jobRepository;
    }
    async handleCron() {
        const expiredJobs = await this.jobRepository.findExpiredOpenJobs();
        for (const job of expiredJobs) {
            job.close();
            await this.jobRepository.update(job);
        }
        if (expiredJobs.length > 0) {
            this.logger.log(`Closed ${expiredJobs.length} expired job(s)`);
        }
    }
};
exports.CloseExpiredJobsCron = CloseExpiredJobsCron;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CloseExpiredJobsCron.prototype, "handleCron", null);
exports.CloseExpiredJobsCron = CloseExpiredJobsCron = CloseExpiredJobsCron_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [job_repository_1.IJobRepository])
], CloseExpiredJobsCron);
//# sourceMappingURL=close-expired-jobs.cron.js.map