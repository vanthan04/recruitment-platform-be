"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryModule = void 0;
const common_1 = require("@nestjs/common");
const category_controller_1 = require("./presentation/controllers/category.controller");
const category_repository_1 = require("./domain/repositories/category.repository");
const category_infra_repository_1 = require("./infrastructure/repositories/category.infra-repository");
const category_prisma_repository_1 = require("./infrastructure/persistence/prisma/category-prisma.repository");
const create_category_use_case_1 = require("./application/use-cases/create-category.use-case");
const update_category_use_case_1 = require("./application/use-cases/update-category.use-case");
const list_categories_use_case_1 = require("./application/use-cases/list-categories.use-case");
const delete_category_use_case_1 = require("./application/use-cases/delete-category.use-case");
let CategoryModule = class CategoryModule {
};
exports.CategoryModule = CategoryModule;
exports.CategoryModule = CategoryModule = __decorate([
    (0, common_1.Module)({
        controllers: [category_controller_1.CategoryController],
        providers: [
            category_prisma_repository_1.CategoryPrismaRepository,
            {
                provide: category_repository_1.ICategoryRepository,
                useClass: category_infra_repository_1.CategoryInfraRepository,
            },
            create_category_use_case_1.CreateCategoryUseCase,
            update_category_use_case_1.UpdateCategoryUseCase,
            list_categories_use_case_1.ListCategoriesUseCase,
            delete_category_use_case_1.DeleteCategoryUseCase,
        ],
        exports: [category_repository_1.ICategoryRepository],
    })
], CategoryModule);
//# sourceMappingURL=category.module.js.map