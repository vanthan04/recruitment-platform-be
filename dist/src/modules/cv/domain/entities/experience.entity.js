"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Experience = void 0;
const base_entity_1 = require("../../../../common/domain/base.entity");
class Experience extends base_entity_1.BaseEntity {
    company;
    position;
    description;
    dateRange;
    cvId;
    constructor(partial) {
        super();
        Object.assign(this, partial);
    }
    get isCurrent() {
        return this.dateRange?.isCurrent ?? false;
    }
}
exports.Experience = Experience;
//# sourceMappingURL=experience.entity.js.map