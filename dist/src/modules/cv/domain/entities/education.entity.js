"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Education = void 0;
const base_entity_1 = require("../../../../common/domain/base.entity");
class Education extends base_entity_1.BaseEntity {
    school;
    degree;
    fieldOfStudy;
    description;
    dateRange;
    cvId;
    constructor(partial) {
        super();
        Object.assign(this, partial);
    }
}
exports.Education = Education;
//# sourceMappingURL=education.entity.js.map