"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookmarkModule = void 0;
const common_1 = require("@nestjs/common");
const bookmark_controller_1 = require("./presentation/controllers/bookmark.controller");
const bookmark_repository_1 = require("./domain/repositories/bookmark.repository");
const bookmark_infra_repository_1 = require("./infrastructure/repositories/bookmark.infra-repository");
const bookmark_prisma_repository_1 = require("./infrastructure/persistence/prisma/bookmark-prisma.repository");
const job_module_1 = require("../job/job.module");
const toggle_bookmark_use_case_1 = require("./application/use-cases/toggle-bookmark.use-case");
const list_bookmarks_use_case_1 = require("./application/use-cases/list-bookmarks.use-case");
let BookmarkModule = class BookmarkModule {
};
exports.BookmarkModule = BookmarkModule;
exports.BookmarkModule = BookmarkModule = __decorate([
    (0, common_1.Module)({
        imports: [job_module_1.JobModule],
        controllers: [bookmark_controller_1.BookmarkController],
        providers: [
            bookmark_prisma_repository_1.BookmarkPrismaRepository,
            {
                provide: bookmark_repository_1.IBookmarkRepository,
                useClass: bookmark_infra_repository_1.BookmarkInfraRepository,
            },
            toggle_bookmark_use_case_1.ToggleBookmarkUseCase,
            list_bookmarks_use_case_1.ListBookmarksUseCase,
        ],
    })
], BookmarkModule);
//# sourceMappingURL=bookmark.module.js.map