"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CvModule = void 0;
const common_1 = require("@nestjs/common");
const cv_controller_1 = require("./presentation/controllers/cv.controller");
const cv_repository_1 = require("./domain/repositories/cv.repository");
const cv_infra_repository_1 = require("./infrastructure/repositories/cv.infra-repository");
const cv_prisma_repository_1 = require("./infrastructure/persistence/prisma/cv-prisma.repository");
const file_upload_module_1 = require("../file-upload/file-upload.module");
const create_cv_use_case_1 = require("./application/use-cases/create-cv.use-case");
const update_cv_use_case_1 = require("./application/use-cases/update-cv.use-case");
const publish_cv_use_case_1 = require("./application/use-cases/publish-cv.use-case");
const get_cv_use_case_1 = require("./application/use-cases/get-cv.use-case");
const list_my_cvs_use_case_1 = require("./application/use-cases/list-my-cvs.use-case");
const delete_cv_use_case_1 = require("./application/use-cases/delete-cv.use-case");
const upload_cv_file_use_case_1 = require("./application/use-cases/upload-cv-file.use-case");
const export_cv_pdf_use_case_1 = require("./application/use-cases/export-cv-pdf.use-case");
let CvModule = class CvModule {
};
exports.CvModule = CvModule;
exports.CvModule = CvModule = __decorate([
    (0, common_1.Module)({
        imports: [file_upload_module_1.FileUploadModule],
        controllers: [cv_controller_1.CvController],
        providers: [
            cv_prisma_repository_1.CvPrismaRepository,
            {
                provide: cv_repository_1.ICvRepository,
                useClass: cv_infra_repository_1.CvInfraRepository,
            },
            create_cv_use_case_1.CreateCvUseCase,
            update_cv_use_case_1.UpdateCvUseCase,
            publish_cv_use_case_1.PublishCvUseCase,
            get_cv_use_case_1.GetCvUseCase,
            list_my_cvs_use_case_1.ListMyCvsUseCase,
            delete_cv_use_case_1.DeleteCvUseCase,
            upload_cv_file_use_case_1.UploadCvFileUseCase,
            export_cv_pdf_use_case_1.ExportCvPdfUseCase,
        ],
        exports: [cv_repository_1.ICvRepository],
    })
], CvModule);
//# sourceMappingURL=cv.module.js.map