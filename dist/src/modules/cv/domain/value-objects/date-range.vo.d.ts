export declare class DateRange {
    readonly startDate: Date;
    readonly endDate: Date | null;
    constructor(startDate: Date, endDate?: Date | null);
    get isCurrent(): boolean;
    get durationInMonths(): number;
    equals(other: DateRange): boolean;
}
