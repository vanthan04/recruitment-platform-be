"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bookmark = void 0;
const base_entity_1 = require("../../../../common/domain/base.entity");
class Bookmark extends base_entity_1.BaseEntity {
    userId;
    jobId;
    constructor(partial) {
        super();
        Object.assign(this, partial);
    }
}
exports.Bookmark = Bookmark;
//# sourceMappingURL=bookmark.entity.js.map