"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobAlertModule = void 0;
const common_1 = require("@nestjs/common");
const saved_search_controller_1 = require("./presentation/controllers/saved-search.controller");
const saved_search_repository_1 = require("./domain/repositories/saved-search.repository");
const saved_search_infra_repository_1 = require("./infrastructure/repositories/saved-search.infra-repository");
const saved_search_prisma_repository_1 = require("./infrastructure/persistence/prisma/saved-search-prisma.repository");
const category_module_1 = require("../category/category.module");
const job_module_1 = require("../job/job.module");
const user_module_1 = require("../user/user.module");
const mail_module_1 = require("../mail/mail.module");
const create_saved_search_use_case_1 = require("./application/use-cases/create-saved-search.use-case");
const list_my_saved_searches_use_case_1 = require("./application/use-cases/list-my-saved-searches.use-case");
const delete_saved_search_use_case_1 = require("./application/use-cases/delete-saved-search.use-case");
const job_alert_digest_cron_1 = require("./application/jobs/job-alert-digest.cron");
let JobAlertModule = class JobAlertModule {
};
exports.JobAlertModule = JobAlertModule;
exports.JobAlertModule = JobAlertModule = __decorate([
    (0, common_1.Module)({
        imports: [category_module_1.CategoryModule, job_module_1.JobModule, user_module_1.UserModule, mail_module_1.MailModule],
        controllers: [saved_search_controller_1.SavedSearchController],
        providers: [
            saved_search_prisma_repository_1.SavedSearchPrismaRepository,
            {
                provide: saved_search_repository_1.ISavedSearchRepository,
                useClass: saved_search_infra_repository_1.SavedSearchInfraRepository,
            },
            create_saved_search_use_case_1.CreateSavedSearchUseCase,
            list_my_saved_searches_use_case_1.ListMySavedSearchesUseCase,
            delete_saved_search_use_case_1.DeleteSavedSearchUseCase,
            job_alert_digest_cron_1.JobAlertDigestCron,
        ],
    })
], JobAlertModule);
//# sourceMappingURL=job-alert.module.js.map