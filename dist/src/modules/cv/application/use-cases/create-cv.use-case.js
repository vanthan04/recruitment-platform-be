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
exports.CreateCvUseCase = void 0;
const common_1 = require("@nestjs/common");
const cv_repository_1 = require("../../domain/repositories/cv.repository");
const cv_entity_1 = require("../../domain/entities/cv.entity");
const cv_status_vo_1 = require("../../domain/value-objects/cv-status.vo");
const cv_response_mapper_1 = require("../mappers/cv-response.mapper");
const experience_entity_1 = require("../../domain/entities/experience.entity");
const date_range_vo_1 = require("../../domain/value-objects/date-range.vo");
const education_entity_1 = require("../../domain/entities/education.entity");
const skill_entity_1 = require("../../domain/entities/skill.entity");
let CreateCvUseCase = class CreateCvUseCase {
    cvRepository;
    constructor(cvRepository) {
        this.cvRepository = cvRepository;
    }
    async execute(userId, input) {
        const cv = new cv_entity_1.Cv({
            title: input.title,
            summary: input.summary ?? null,
            status: cv_status_vo_1.CvStatus.DRAFT,
            userId,
        });
        if (input.experiences) {
            for (const exp of input.experiences) {
                cv.addExperience(new experience_entity_1.Experience({
                    company: exp.company,
                    position: exp.position,
                    description: exp.description ?? null,
                    dateRange: new date_range_vo_1.DateRange(exp.startDate, exp.endDate ?? null),
                    cvId: cv.id,
                }));
            }
        }
        if (input.educations) {
            for (const edu of input.educations) {
                cv.addEducation(new education_entity_1.Education({
                    school: edu.school,
                    degree: edu.degree,
                    fieldOfStudy: edu.fieldOfStudy ?? null,
                    description: edu.description ?? null,
                    dateRange: new date_range_vo_1.DateRange(edu.startDate, edu.endDate ?? null),
                    cvId: cv.id,
                }));
            }
        }
        if (input.skills) {
            for (const skill of input.skills) {
                cv.addSkill(new skill_entity_1.Skill({
                    name: skill.name,
                    level: skill.level ?? null,
                    cvId: cv.id,
                }));
            }
        }
        const saved = await this.cvRepository.save(cv);
        return cv_response_mapper_1.CvResponseMapper.toDto(saved);
    }
};
exports.CreateCvUseCase = CreateCvUseCase;
exports.CreateCvUseCase = CreateCvUseCase = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [cv_repository_1.ICvRepository])
], CreateCvUseCase);
//# sourceMappingURL=create-cv.use-case.js.map