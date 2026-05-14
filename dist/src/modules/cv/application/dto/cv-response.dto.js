"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkillResponseDto = exports.EducationResponseDto = exports.ExperienceResponseDto = exports.CvResponseDto = void 0;
class CvResponseDto {
    id;
    title;
    summary;
    status;
    publishedAt;
    createdAt;
    updatedAt;
    userId;
    experiences;
    educations;
    skills;
}
exports.CvResponseDto = CvResponseDto;
class ExperienceResponseDto {
    id;
    company;
    position;
    description;
    startDate;
    endDate;
    isCurrent;
}
exports.ExperienceResponseDto = ExperienceResponseDto;
class EducationResponseDto {
    id;
    school;
    degree;
    fieldOfStudy;
    description;
    startDate;
    endDate;
}
exports.EducationResponseDto = EducationResponseDto;
class SkillResponseDto {
    id;
    name;
    level;
}
exports.SkillResponseDto = SkillResponseDto;
//# sourceMappingURL=cv-response.dto.js.map