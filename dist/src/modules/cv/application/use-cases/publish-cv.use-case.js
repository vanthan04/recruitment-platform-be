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
exports.PublishCvUseCase = void 0;
const common_1 = require("@nestjs/common");
const cv_repository_1 = require("../../domain/repositories/cv.repository");
const domain_exception_1 = require("../../../../common/exceptions/domain.exception");
const cv_response_mapper_1 = require("../mappers/cv-response.mapper");
let PublishCvUseCase = class PublishCvUseCase {
    cvRepository;
    constructor(cvRepository) {
        this.cvRepository = cvRepository;
    }
    async execute(userId, cvId) {
        const cv = await this.cvRepository.findByIdWithRelations(cvId);
        if (!cv) {
            throw new domain_exception_1.EntityNotFoundException('CV', cvId);
        }
        cv.ensureOwner(userId);
        cv.publish();
        const updated = await this.cvRepository.update(cv);
        return cv_response_mapper_1.CvResponseMapper.toDto(updated);
    }
};
exports.PublishCvUseCase = PublishCvUseCase;
exports.PublishCvUseCase = PublishCvUseCase = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [cv_repository_1.ICvRepository])
], PublishCvUseCase);
//# sourceMappingURL=publish-cv.use-case.js.map