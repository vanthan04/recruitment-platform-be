export interface IPaginationInformation {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    nextPage: number | null;
    prevPage: number | null;
}
export declare const normalizePagination: ({ page, limit, }: {
    page: number;
    limit: number;
}) => {
    page: number;
    limit: number;
    skip: number;
};
export declare const getPaginationInfo: ({ page, total, limit, }: {
    page: number;
    total: number;
    limit: number;
}) => IPaginationInformation;
export declare const getSortedDataInfo: ({ sortKey, order }: {
    sortKey: string;
    order: string;
}) => {
    sortKey: string;
    order: string;
};
