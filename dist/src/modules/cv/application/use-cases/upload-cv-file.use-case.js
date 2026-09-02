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
exports.UploadCvFileUseCase = void 0;
const common_1 = require("@nestjs/common");
const cv_repository_1 = require("../../domain/repositories/cv.repository");
const file_upload_service_1 = require("../../../file-upload/application/file-upload.service");
const domain_exception_1 = require("../../../../common/exceptions/domain.exception");
const cv_response_mapper_1 = require("../mappers/cv-response.mapper");
const ALLOWED_CV_FILE_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
let UploadCvFileUseCase = class UploadCvFileUseCase {
    cvRepository;
    fileUploadService;
    constructor(cvRepository, fileUploadService) {
        this.cvRepository = cvRepository;
        this.fileUploadService = fileUploadService;
    }
    async execute(userId, cvId, file) {
        const cv = await this.cvRepository.findByIdWithRelations(cvId);
        if (!cv) {
            throw new domain_exception_1.EntityNotFoundException('CV', cvId);
        }
        cv.ensureOwner(userId);
        const { url } = await this.fileUploadService.uploadFile(file, 'cvs', ALLOWED_CV_FILE_TYPES);
        cv.attachFile(url);
        const updated = await this.cvRepository.update(cv);
        return cv_response_mapper_1.CvResponseMapper.toDto(updated);
    }
};
exports.UploadCvFileUseCase = UploadCvFileUseCase;
exports.UploadCvFileUseCase = UploadCvFileUseCase = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [cv_repository_1.ICvRepository,
        file_upload_service_1.FileUploadService])
], UploadCvFileUseCase);
//# sourceMappingURL=upload-cv-file.use-case.js.map