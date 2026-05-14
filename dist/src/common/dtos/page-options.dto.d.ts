export declare enum Order {
    ASC = "ASC",
    DESC = "DESC"
}
export declare class PageOptionsDto {
    readonly order?: Order;
    readonly page?: number;
    readonly limit?: number;
    get skip(): number;
}
