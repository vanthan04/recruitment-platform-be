"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Category = void 0;
const base_entity_1 = require("../../../../common/domain/base.entity");
class Category extends base_entity_1.BaseEntity {
    name;
    slug;
    constructor(partial) {
        super();
        Object.assign(this, partial);
    }
    updateName(name) {
        this.name = name;
    }
}
exports.Category = Category;
//# sourceMappingURL=category.entity.js.map