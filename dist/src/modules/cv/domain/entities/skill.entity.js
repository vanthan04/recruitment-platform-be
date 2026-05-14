"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Skill = void 0;
const base_entity_1 = require("../../../../common/domain/base.entity");
class Skill extends base_entity_1.BaseEntity {
    name;
    level;
    cvId;
    constructor(partial) {
        super();
        Object.assign(this, partial);
    }
}
exports.Skill = Skill;
//# sourceMappingURL=skill.entity.js.map