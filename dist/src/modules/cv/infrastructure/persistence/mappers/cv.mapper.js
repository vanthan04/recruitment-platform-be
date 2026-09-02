"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CvMapper = void 0;
const cv_entity_1 = require("../../../domain/entities/cv.entity");
const experience_entity_1 = require("../../../domain/entities/experience.entity");
const education_entity_1 = require("../../../domain/entities/education.entity");
const skill_entity_1 = require("../../../domain/entities/skill.entity");
const date_range_vo_1 = require("../../../domain/value-objects/date-range.vo");
class CvMapper {
    static toDomain(raw) {
        if (!raw)
            return null;
        return new cv_entity_1.Cv({
            id: raw.id,
            title: raw.title,
            summary: raw.summary,
            fileUrl: raw.fileUrl,
            status: raw.status,
            publishedAt: raw.publishedAt,
            deletedAt: raw.deletedAt,
            userId: raw.userId,
            createdAt: raw.createdAt,
            updatedAt: raw.updatedAt,
            experiences: raw.experiences?.map(CvMapper.experienceToDomain) ?? [],
            educations: raw.educations?.map(CvMapper.educationToDomain) ?? [],
            skills: raw.skills?.map(CvMapper.skillToDomain) ?? [],
        });
    }
    static experienceToDomain(raw) {
        return new experience_entity_1.Experience({
            id: raw.id,
            company: raw.company,
            position: raw.position,
            description: raw.description,
            dateRange: new date_range_vo_1.DateRange(raw.startDate, raw.endDate),
            cvId: raw.cvId,
            createdAt: raw.createdAt,
            updatedAt: raw.updatedAt,
        });
    }
    static educationToDomain(raw) {
        return new education_entity_1.Education({
            id: raw.id,
            school: raw.school,
            degree: raw.degree,
            fieldOfStudy: raw.fieldOfStudy,
            description: raw.description,
            dateRange: new date_range_vo_1.DateRange(raw.startDate, raw.endDate),
            cvId: raw.cvId,
            createdAt: raw.createdAt,
            updatedAt: raw.updatedAt,
        });
    }
    static skillToDomain(raw) {
        return new skill_entity_1.Skill({
            id: raw.id,
            name: raw.name,
            level: raw.level,
            cvId: raw.cvId,
            createdAt: raw.createdAt,
            updatedAt: raw.updatedAt,
        });
    }
    static toPersistence(cv) {
        return {
            id: cv.id,
            title: cv.title,
            summary: cv.summary,
            fileUrl: cv.fileUrl,
            status: cv.status,
            publishedAt: cv.publishedAt,
            deletedAt: cv.deletedAt,
            userId: cv.userId,
        };
    }
    static experienceToPersistence(exp) {
        return {
            id: exp.id,
            company: exp.company,
            position: exp.position,
            description: exp.description,
            startDate: exp.dateRange.startDate,
            endDate: exp.dateRange.endDate,
            isCurrent: exp.dateRange.isCurrent,
        };
    }
    static educationToPersistence(edu) {
        return {
            id: edu.id,
            school: edu.school,
            degree: edu.degree,
            fieldOfStudy: edu.fieldOfStudy,
            description: edu.description,
            startDate: edu.dateRange.startDate,
            endDate: edu.dateRange.endDate,
        };
    }
    static skillToPersistence(skill) {
        return {
            id: skill.id,
            name: skill.name,
            level: skill.level,
        };
    }
}
exports.CvMapper = CvMapper;
//# sourceMappingURL=cv.mapper.js.map