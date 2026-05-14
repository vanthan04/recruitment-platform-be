"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CvDomainService = void 0;
const domain_exception_1 = require("../../../../common/exceptions/domain.exception");
class CvDomainService {
    static validateForApplication(cv) {
        if (!cv.isPublished) {
            throw new domain_exception_1.BusinessRuleViolationException('Only published CVs can be used for job applications');
        }
        if (cv.isDeleted) {
            throw new domain_exception_1.BusinessRuleViolationException('Deleted CVs cannot be used for job applications');
        }
    }
    static isReadyForPublish(cv) {
        const reasons = [];
        if (!cv.title || cv.title.trim().length === 0) {
            reasons.push('CV must have a title');
        }
        if (cv.experiences.length === 0 && cv.educations.length === 0) {
            reasons.push('CV must have at least one experience or education');
        }
        return {
            ready: reasons.length === 0,
            reasons,
        };
    }
}
exports.CvDomainService = CvDomainService;
//# sourceMappingURL=cv-domain.service.js.map