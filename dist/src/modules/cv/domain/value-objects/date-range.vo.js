"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DateRange = void 0;
class DateRange {
    startDate;
    endDate;
    constructor(startDate, endDate = null) {
        if (endDate && endDate < startDate) {
            throw new Error('End date cannot be before start date');
        }
        this.startDate = startDate;
        this.endDate = endDate;
    }
    get isCurrent() {
        return this.endDate === null;
    }
    get durationInMonths() {
        const end = this.endDate ?? new Date();
        const months = (end.getFullYear() - this.startDate.getFullYear()) * 12 +
            (end.getMonth() - this.startDate.getMonth());
        return Math.max(0, months);
    }
    equals(other) {
        return (this.startDate.getTime() === other.startDate.getTime() &&
            this.endDate?.getTime() === other.endDate?.getTime());
    }
}
exports.DateRange = DateRange;
//# sourceMappingURL=date-range.vo.js.map