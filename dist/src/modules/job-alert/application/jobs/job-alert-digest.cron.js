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
var JobAlertDigestCron_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobAlertDigestCron = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const saved_search_repository_1 = require("../../domain/repositories/saved-search.repository");
const job_repository_1 = require("../../../job/domain/repositories/job.repository");
const user_repository_1 = require("../../../user/domain/repositories/user.repository");
const mail_service_port_1 = require("../../../mail/domain/ports/mail.service.port");
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
let JobAlertDigestCron = JobAlertDigestCron_1 = class JobAlertDigestCron {
    savedSearchRepository;
    jobRepository;
    userRepository;
    mailService;
    logger = new common_1.Logger(JobAlertDigestCron_1.name);
    constructor(savedSearchRepository, jobRepository, userRepository, mailService) {
        this.savedSearchRepository = savedSearchRepository;
        this.jobRepository = jobRepository;
        this.userRepository = userRepository;
        this.mailService = mailService;
    }
    async handleCron() {
        const savedSearches = await this.savedSearchRepository.findAll();
        const since = new Date(Date.now() - ONE_DAY_MS);
        let emailsSent = 0;
        for (const search of savedSearches) {
            const { jobs } = await this.jobRepository.findAllPaginated({
                page: 1,
                limit: 20,
                keyword: search.keyword ?? undefined,
                location: search.location ?? undefined,
                jobType: search.jobType ?? undefined,
                categoryId: search.categoryId ?? undefined,
            });
            const newJobs = jobs.filter((job) => job.createdAt >= since);
            if (newJobs.length === 0)
                continue;
            const user = await this.userRepository.findById(search.userId);
            if (!user)
                continue;
            const jobListHtml = newJobs
                .map((job) => `<li>${job.title} — ${job.company?.name ?? ''} (${job.location})</li>`)
                .join('');
            await this.mailService.sendEmail({
                to: user.email,
                subject: `${newJobs.length} new job(s) matching your saved search`,
                html: `<p>Here are new jobs matching your saved search:</p><ul>${jobListHtml}</ul>`,
                text: newJobs.map((job) => `${job.title} — ${job.location}`).join('\n'),
            });
            emailsSent++;
        }
        if (emailsSent > 0) {
            this.logger.log(`Sent ${emailsSent} job alert digest email(s)`);
        }
    }
};
exports.JobAlertDigestCron = JobAlertDigestCron;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_7AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], JobAlertDigestCron.prototype, "handleCron", null);
exports.JobAlertDigestCron = JobAlertDigestCron = JobAlertDigestCron_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [saved_search_repository_1.ISavedSearchRepository,
        job_repository_1.IJobRepository,
        user_repository_1.IUserRepository,
        mail_service_port_1.IMailService])
], JobAlertDigestCron);
//# sourceMappingURL=job-alert-digest.cron.js.map