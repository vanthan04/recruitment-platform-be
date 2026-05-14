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
exports.ListBookmarksUseCase = void 0;
const common_1 = require("@nestjs/common");
const bookmark_repository_1 = require("../../domain/repositories/bookmark.repository");
const bookmark_response_mapper_1 = require("../mappers/bookmark-response.mapper");
let ListBookmarksUseCase = class ListBookmarksUseCase {
    bookmarkRepository;
    constructor(bookmarkRepository) {
        this.bookmarkRepository = bookmarkRepository;
    }
    async execute(userId) {
        const bookmarks = await this.bookmarkRepository.findAllByUserId(userId);
        return bookmark_response_mapper_1.BookmarkResponseMapper.toDtoList(bookmarks);
    }
};
exports.ListBookmarksUseCase = ListBookmarksUseCase;
exports.ListBookmarksUseCase = ListBookmarksUseCase = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [bookmark_repository_1.IBookmarkRepository])
], ListBookmarksUseCase);
//# sourceMappingURL=list-bookmarks.use-case.js.map