export declare class SalaryRange {
    readonly min: number | null;
    readonly max: number | null;
    readonly currency: string;
    constructor(min: number | null, max: number | null, currency?: string);
    get isNegotiable(): boolean;
    format(): string;
    equals(other: SalaryRange): boolean;
}
