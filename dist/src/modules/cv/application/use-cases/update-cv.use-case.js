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
exports.UpdateCvUseCase = void 0;
const common_1 = require("@nestjs/common");
const cv_repository_1 = require("../../domain/repositories/cv.repository");
const domain_exception_1 = require("../../../../common/exceptions/domain.exception");
const cv_response_mapper_1 = require("../mappers/cv-response.mapper");
const experience_entity_1 = require("../../domain/entities/experience.entity");
const education_entity_1 = require("../../domain/entities/education.entity");
const skill_entity_1 = require("../../domain/entities/skill.entity");
const date_range_vo_1 = require("../../domain/value-objects/date-range.vo");
let UpdateCvUseCase = class UpdateCvUseCase {
    cvRepository;
    constructor(cvRepository) {
        this.cvRepository = cvRepository;
    }
    async execute(userId, cvId, input) {
        const cv = await this.cvRepository.findByIdWithRelations(cvId);
        if (!cv) {
            throw new domain_exception_1.EntityNotFoundException('CV', cvId);
        }
        cv.ensureOwner(userId);
        if (input.title !== undefined) {
            cv.updateTitle(input.title);
        }
        if (input.summary !== undefined) {
            cv.updateSummary(input.summary);
        }
        if (input.experiences !== undefined) {
            cv.experiences = input.experiences.map((exp) => new experience_entity_1.Experience({
                id: exp.id,
                company: exp.company,
                position: exp.position,
                description: exp.description ?? null,
                dateRange: new date_range_vo_1.DateRange(exp.startDate, exp.endDate ?? null),
                cvId: cv.id,
            }));
        }
        if (input.educations !== undefined) {
            cv.educations = input.educations.map((edu) => new education_entity_1.Education({
                id: edu.id,
                school: edu.school,
                degree: edu.degree,
                fieldOfStudy: edu.fieldOfStudy ?? null,
                description: edu.description ?? null,
                dateRange: new date_range_vo_1.DateRange(edu.startDate, edu.endDate ?? null),
                cvId: cv.id,
            }));
        }
        if (input.skills !== undefined) {
            cv.skills = input.skills.map((s) => new skill_entity_1.Skill({
                id: s.id,
                name: s.name,
                level: s.level ?? null,
                cvId: cv.id,
            }));
        }
        const updated = await this.cvRepository.update(cv);
        return cv_response_mapper_1.CvResponseMapper.toDto(updated);
    }
};
exports.UpdateCvUseCase = UpdateCvUseCase;
exports.UpdateCvUseCase = UpdateCvUseCase = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [cv_repository_1.ICvRepository])
], UpdateCvUseCase);
//# sourceMappingURL=update-cv.use-case.js.map