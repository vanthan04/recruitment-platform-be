/**
 * DateRange value object.
 * Immutable — represents a period of time with start and optional end date.
 * Framework-agnostic — no NestJS or Prisma imports.
 */
export class DateRange {
  readonly startDate: Date;
  readonly endDate: Date | null;

  constructor(startDate: Date, endDate: Date | null = null) {
    if (endDate && endDate < startDate) {
      throw new Error('End date cannot be before start date');
    }
    this.startDate = startDate;
    this.endDate = endDate;
  }

  get isCurrent(): boolean {
    return this.endDate === null;
  }

  get durationInMonths(): number {
    const end = this.endDate ?? new Date();
    const months =
      (end.getFullYear() - this.startDate.getFullYear()) * 12 +
      (end.getMonth() - this.startDate.getMonth());
    return Math.max(0, months);
  }

  equals(other: DateRange): boolean {
    return (
      this.startDate.getTime() === other.startDate.getTime() &&
      this.endDate?.getTime() === other.endDate?.getTime()
    );
  }
}
