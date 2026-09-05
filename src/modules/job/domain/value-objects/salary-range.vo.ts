import { InvalidSalaryRangeException } from '@/modules/job/domain/exceptions/job.exceptions';

/**
 * SalaryRange value object.
 * Immutable — represents a salary range with currency.
 * Framework-agnostic (the exception it throws is a plain Error subclass
 * with zero Nest/Prisma imports, so this stays a pure domain type).
 */
export class SalaryRange {
  readonly min: number | null;
  readonly max: number | null;
  readonly currency: string;

  constructor(min: number | null, max: number | null, currency = 'VND') {
    if (min !== null && max !== null && min > max) {
      throw new InvalidSalaryRangeException();
    }
    this.min = min;
    this.max = max;
    this.currency = currency;
  }

  get isNegotiable(): boolean {
    return this.min === null && this.max === null;
  }

  format(): string {
    if (this.isNegotiable) return 'Negotiable';
    if (this.min && this.max) {
      return `${this.min.toLocaleString()} - ${this.max.toLocaleString()} ${this.currency}`;
    }
    if (this.min) return `From ${this.min.toLocaleString()} ${this.currency}`;
    if (this.max) return `Up to ${this.max.toLocaleString()} ${this.currency}`;
    return 'Negotiable';
  }

  equals(other: SalaryRange): boolean {
    return (
      this.min === other.min &&
      this.max === other.max &&
      this.currency === other.currency
    );
  }
}
