"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const auth_module_1 = require("./modules/auth/auth.module");
const user_module_1 = require("./modules/user/user.module");
const prisma_module_1 = require("./modules/prisma/prisma.module");
const file_upload_module_1 = require("./modules/file-upload/file-upload.module");
const cv_module_1 = require("./modules/cv/cv.module");
const job_module_1 = require("./modules/job/job.module");
const job_application_module_1 = require("./modules/application/job-application.module");
const bookmark_module_1 = require("./modules/bookmark/bookmark.module");
const env_validation_1 = require("./common/config/env.validation");
const app_config_1 = __importDefault(require("./common/config/app.config"));
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                validationSchema: env_validation_1.envValidationSchema,
                load: [app_config_1.default],
            }),
            prisma_module_1.PrismaModule.forRoot({
                log: ['query', 'info', 'warn', 'error'],
                errorFormat: 'pretty',
            }),
            auth_module_1.AuthModule,
            user_module_1.UserModule,
            file_upload_module_1.FileUploadModule,
            cv_module_1.CvModule,
            job_module_1.JobModule,
            job_application_module_1.JobApplicationModule,
            bookmark_module_1.BookmarkModule,
        ],
        controllers: [],
        providers: [],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map