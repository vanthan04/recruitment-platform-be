"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSortedDataInfo = exports.getPaginationInfo = exports.normalizePagination = void 0;
const constants_1 = require("../constants");
const normalizePagination = ({ page, limit, }) => {
    if (isNaN(page) || page < 1)
        page = constants_1.DEFAULT_PAGINATION.PAGE;
    if (isNaN(limit) || limit < 1)
        limit = constants_1.DEFAULT_PAGINATION.LIMIT;
    const skip = (page - 1) * limit;
    return { page, limit, skip };
};
exports.normalizePagination = normalizePagination;
const getPaginationInfo = ({ page, total, limit, }) => {
    let totalPages = Math.ceil(total / limit);
    const currentPage = Math.max(constants_1.DEFAULT_PAGINATION.DEFAULT_PAGE, page);
    if (totalPages < currentPage && totalPages !== 0) {
    }
    if (totalPages < currentPage)
        totalPages = totalPages;
    const hasNextPage = currentPage < totalPages;
    const hasPrevPage = currentPage > 1;
    return {
        page: currentPage,
        limit,
        total,
        totalPages,
        nextPage: hasNextPage ? currentPage + 1 : null,
        prevPage: hasPrevPage ? currentPage - 1 : null,
    };
};
exports.getPaginationInfo = getPaginationInfo;
const getSortedDataInfo = ({ sortKey, order }) => {
    const sortKeyMap = {
        date: 'createdAt',
    };
    return { sortKey: sortKeyMap[sortKey] || sortKey, order };
};
exports.getSortedDataInfo = getSortedDataInfo;
//# sourceMappingURL=pagination.util.js.map