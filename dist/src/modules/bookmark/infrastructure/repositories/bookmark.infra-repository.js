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
exports.BookmarkInfraRepository = void 0;
const common_1 = require("@nestjs/common");
const bookmark_prisma_repository_1 = require("../persistence/prisma/bookmark-prisma.repository");
const bookmark_mapper_1 = require("../persistence/mappers/bookmark.mapper");
let BookmarkInfraRepository = class BookmarkInfraRepository {
    bookmarkPrisma;
    constructor(bookmarkPrisma) {
        this.bookmarkPrisma = bookmarkPrisma;
    }
    async findByUserIdAndJobId(userId, jobId) {
        const raw = await this.bookmarkPrisma.findByUserIdAndJobId(userId, jobId);
        return bookmark_mapper_1.BookmarkMapper.toDomain(raw);
    }
    async findAllByUserId(userId) {
        const raws = await this.bookmarkPrisma.findAllByUserId(userId);
        return raws.map((r) => bookmark_mapper_1.BookmarkMapper.toDomain(r));
    }
    async save(bookmark) {
        const data = bookmark_mapper_1.BookmarkMapper.toPersistence(bookmark);
        const raw = await this.bookmarkPrisma.create(data);
        return bookmark_mapper_1.BookmarkMapper.toDomain(raw);
    }
    async delete(userId, jobId) {
        await this.bookmarkPrisma.delete(userId, jobId);
    }
};
exports.BookmarkInfraRepository = BookmarkInfraRepository;
exports.BookmarkInfraRepository = BookmarkInfraRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [bookmark_prisma_repository_1.BookmarkPrismaRepository])
], BookmarkInfraRepository);
//# sourceMappingURL=bookmark.infra-repository.js.map