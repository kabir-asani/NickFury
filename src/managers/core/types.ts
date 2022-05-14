export interface PaginationQuery {
    nextToken?: String;
    limit?: Number;
}

export interface Paginated<T> {
    readonly page: T[];
    readonly nextToken?: String;
}

export const MAXIMUM_PAGINATED_PAGE_LENGTH = 25;