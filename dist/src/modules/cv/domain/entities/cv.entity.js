"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cv = void 0;
const base_entity_1 = require("../../../../common/domain/base.entity");
const cv_status_vo_1 = require("../value-objects/cv-status.vo");
const domain_exception_1 = require("../../../../common/exceptions/domain.exception");
class Cv extends base_entity_1.BaseEntity {
    title;
    summary;
    fileUrl;
    status;
    publishedAt;
    deletedAt;
    userId;
    experiences;
    educations;
    skills;
    constructor(partial) {
        super();
        Object.assign(this, partial);
        this.status = partial.status ?? cv_status_vo_1.CvStatus.DRAFT;
        this.fileUrl = partial.fileUrl ?? null;
        this.experiences = partial.experiences ?? [];
        this.educations = partial.educations ?? [];
        this.skills = partial.skills ?? [];
        this.publishedAt = partial.publishedAt ?? null;
        this.deletedAt = partial.deletedAt ?? null;
    }
    publish() {
        if (this.status === cv_status_vo_1.CvStatus.PUBLISHED) {
            throw new domain_exception_1.BusinessRuleViolationException('CV is already published');
        }
        if (this.experiences.length === 0 && this.educations.length === 0) {
            throw new domain_exception_1.BusinessRuleViolationException('CV must have at least one experience or education to be published');
        }
        this.status = cv_status_vo_1.CvStatus.PUBLISHED;
        this.publishedAt = new Date();
    }
    unpublish() {
        if (this.status === cv_status_vo_1.CvStatus.DRAFT) {
            throw new domain_exception_1.BusinessRuleViolationException('CV is already in draft');
        }
        this.status = cv_status_vo_1.CvStatus.DRAFT;
        this.publishedAt = null;
    }
    softDelete() {
        if (this.deletedAt) {
            throw new domain_exception_1.BusinessRuleViolationException('CV is already deleted');
        }
        this.deletedAt = new Date();
        this.status = cv_status_vo_1.CvStatus.DRAFT;
    }
    restore() {
        if (!this.deletedAt) {
            throw new domain_exception_1.BusinessRuleViolationException('CV is not deleted');
        }
        this.deletedAt = null;
    }
    ensureOwner(userId) {
        if (this.userId !== userId) {
            throw new domain_exception_1.UnauthorizedDomainException('You are not the owner of this CV');
        }
    }
    get isPublished() {
        return this.status === cv_status_vo_1.CvStatus.PUBLISHED;
    }
    get isDraft() {
        return this.status === cv_status_vo_1.CvStatus.DRAFT;
    }
    get isDeleted() {
        return this.deletedAt !== null;
    }
    addExperience(experience) {
        this.experiences.push(experience);
    }
    addEducation(education) {
        this.educations.push(education);
    }
    addSkill(skill) {
        const exists = this.skills.some((s) => s.name.toLowerCase() === skill.name.toLowerCase());
        if (exists) {
            throw new domain_exception_1.BusinessRuleViolationException(`Skill "${skill.name}" already exists in this CV`);
        }
        this.skills.push(skill);
    }
    removeSkill(skillId) {
        this.skills = this.skills.filter((s) => s.id !== skillId);
    }
    updateTitle(title) {
        if (!title || title.trim().length === 0) {
            throw new domain_exception_1.BusinessRuleViolationException('CV title cannot be empty');
        }
        this.title = title.trim();
    }
    updateSummary(summary) {
        this.summary = summary?.trim() ?? null;
    }
    attachFile(fileUrl) {
        this.fileUrl = fileUrl;
    }
}
exports.Cv = Cv;
//# sourceMappingURL=cv.entity.js.map