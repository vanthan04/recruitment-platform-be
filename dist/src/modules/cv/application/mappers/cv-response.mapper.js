"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CvResponseMapper = void 0;
const cv_response_dto_1 = require("../dto/cv-response.dto");
class CvResponseMapper {
    static toDto(cv) {
        const dto = new cv_response_dto_1.CvResponseDto();
        dto.id = cv.id;
        dto.title = cv.title;
        dto.summary = cv.summary;
        dto.status = cv.status;
        dto.publishedAt = cv.publishedAt;
        dto.createdAt = cv.createdAt;
        dto.updatedAt = cv.updatedAt;
        dto.userId = cv.userId;
        dto.experiences = (cv.experiences ?? []).map(CvResponseMapper.toExperienceDto);
        dto.educations = (cv.educations ?? []).map(CvResponseMapper.toEducationDto);
        dto.skills = (cv.skills ?? []).map(CvResponseMapper.toSkillDto);
        return dto;
    }
    static toDtoList(cvs) {
        return cvs.map(CvResponseMapper.toDto);
    }
    static toExperienceDto(exp) {
        const dto = new cv_response_dto_1.ExperienceResponseDto();
        dto.id = exp.id;
        dto.company = exp.company;
        dto.position = exp.position;
        dto.description = exp.description;
        dto.startDate = exp.dateRange?.startDate ?? exp.startDate;
        dto.endDate = exp.dateRange?.endDate ?? exp.endDate;
        dto.isCurrent = exp.dateRange?.isCurrent ?? exp.isCurrent ?? false;
        return dto;
    }
    static toEducationDto(edu) {
        const dto = new cv_response_dto_1.EducationResponseDto();
        dto.id = edu.id;
        dto.school = edu.school;
        dto.degree = edu.degree;
        dto.fieldOfStudy = edu.fieldOfStudy;
        dto.description = edu.description;
        dto.startDate = edu.dateRange?.startDate ?? edu.startDate;
        dto.endDate = edu.dateRange?.endDate ?? edu.endDate;
        return dto;
    }
    static toSkillDto(skill) {
        const dto = new cv_response_dto_1.SkillResponseDto();
        dto.id = skill.id;
        dto.name = skill.name;
        dto.level = skill.level;
        return dto;
    }
}
exports.CvResponseMapper = CvResponseMapper;
//# sourceMappingURL=cv-response.mapper.js.map