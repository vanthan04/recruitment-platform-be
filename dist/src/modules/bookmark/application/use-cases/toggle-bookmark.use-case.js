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
exports.ToggleBookmarkUseCase = void 0;
const common_1 = require("@nestjs/common");
const bookmark_repository_1 = require("../../domain/repositories/bookmark.repository");
const job_repository_1 = require("../../../job/domain/repositories/job.repository");
const bookmark_entity_1 = require("../../domain/entities/bookmark.entity");
const domain_exception_1 = require("../../../../common/exceptions/domain.exception");
let ToggleBookmarkUseCase = class ToggleBookmarkUseCase {
    bookmarkRepository;
    jobRepository;
    constructor(bookmarkRepository, jobRepository) {
        this.bookmarkRepository = bookmarkRepository;
        this.jobRepository = jobRepository;
    }
    async execute(userId, jobId) {
        const job = await this.jobRepository.findById(jobId);
        if (!job)
            throw new domain_exception_1.EntityNotFoundException('Job', jobId);
        const existing = await this.bookmarkRepository.findByUserIdAndJobId(userId, jobId);
        if (existing) {
            await this.bookmarkRepository.delete(userId, jobId);
            return { bookmarked: false };
        }
        const bookmark = new bookmark_entity_1.Bookmark({ userId, jobId });
        await this.bookmarkRepository.save(bookmark);
        return { bookmarked: true };
    }
};
exports.ToggleBookmarkUseCase = ToggleBookmarkUseCase;
exports.ToggleBookmarkUseCase = ToggleBookmarkUseCase = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [bookmark_repository_1.IBookmarkRepository,
        job_repository_1.IJobRepository])
], ToggleBookmarkUseCase);
//# sourceMappingURL=toggle-bookmark.use-case.js.map