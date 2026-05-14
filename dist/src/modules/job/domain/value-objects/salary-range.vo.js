"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalaryRange = void 0;
class SalaryRange {
    min;
    max;
    currency;
    constructor(min, max, currency = 'VND') {
        if (min !== null && max !== null && min > max) {
            throw new Error('Minimum salary cannot be greater than maximum salary');
        }
        this.min = min;
        this.max = max;
        this.currency = currency;
    }
    get isNegotiable() {
        return this.min === null && this.max === null;
    }
    format() {
        if (this.isNegotiable)
            return 'Negotiable';
        if (this.min && this.max) {
            return `${this.min.toLocaleString()} - ${this.max.toLocaleString()} ${this.currency}`;
        }
        if (this.min)
            return `From ${this.min.toLocaleString()} ${this.currency}`;
        if (this.max)
            return `Up to ${this.max.toLocaleString()} ${this.currency}`;
        return 'Negotiable';
    }
    equals(other) {
        return (this.min === other.min &&
            this.max === other.max &&
            this.currency === other.currency);
    }
}
exports.SalaryRange = SalaryRange;
//# sourceMappingURL=salary-range.vo.js.map