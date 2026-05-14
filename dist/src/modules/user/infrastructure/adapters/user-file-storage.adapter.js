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
exports.UserFileStorageAdapter = void 0;
const common_1 = require("@nestjs/common");
const file_upload_service_1 = require("../../../file-upload/application/file-upload.service");
let UserFileStorageAdapter = class UserFileStorageAdapter {
    fileUploadService;
    constructor(fileUploadService) {
        this.fileUploadService = fileUploadService;
    }
    async uploadFile(file, folder) {
        const result = await this.fileUploadService.uploadFile(file, folder);
        return result.url;
    }
    async deleteFile(fileUrl) {
        console.log(`Deleting file: ${fileUrl}`);
    }
};
exports.UserFileStorageAdapter = UserFileStorageAdapter;
exports.UserFileStorageAdapter = UserFileStorageAdapter = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [file_upload_service_1.FileUploadService])
], UserFileStorageAdapter);
//# sourceMappingURL=user-file-storage.adapter.js.map