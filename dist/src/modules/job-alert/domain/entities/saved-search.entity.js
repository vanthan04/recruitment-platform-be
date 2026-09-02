"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SavedSearch = void 0;
const base_entity_1 = require("../../../../common/domain/base.entity");
class SavedSearch extends base_entity_1.BaseEntity {
    userId;
    keyword;
    location;
    categoryId;
    jobType;
    constructor(partial) {
        super();
        Object.assign(this, partial);
        this.keyword = partial.keyword ?? null;
        this.location = partial.location ?? null;
        this.categoryId = partial.categoryId ?? null;
        this.jobType = partial.jobType ?? null;
    }
}
exports.SavedSearch = SavedSearch;
//# sourceMappingURL=saved-search.entity.js.map