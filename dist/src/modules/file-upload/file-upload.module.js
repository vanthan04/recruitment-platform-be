"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileUploadModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const file_storage_provider_interface_1 = require("./domain/providers/file-storage.provider.interface");
const s3_storage_provider_1 = require("./infrastructure/storage/s3-storage.provider");
const upload_file_use_case_1 = require("./application/use-cases/upload-file.use-case");
const file_upload_service_1 = require("./application/file-upload.service");
const file_upload_controller_1 = require("./presentation/controllers/file-upload.controller");
let FileUploadModule = class FileUploadModule {
};
exports.FileUploadModule = FileUploadModule;
exports.FileUploadModule = FileUploadModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule],
        controllers: [file_upload_controller_1.FileUploadController],
        providers: [
            {
                provide: file_storage_provider_interface_1.IFileStorageProvider,
                useClass: s3_storage_provider_1.S3StorageProvider,
            },
            upload_file_use_case_1.UploadFileUseCase,
            file_upload_service_1.FileUploadService,
        ],
        exports: [file_upload_service_1.FileUploadService],
    })
], FileUploadModule);
//# sourceMappingURL=file-upload.module.js.map