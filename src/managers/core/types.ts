export interface PaginationParameters {
    nextToken?: String;
    limit?: Number;
}

export interface ViewablesParameters {
    viewerId?: String;
}

export interface ViewablesParameters2 {
    viewerId: String;
}

export interface Value<T> {
    [key: string]: T;
}

export interface Paginated<T> {
    readonly page: T[];
    readonly nextToken?: String;
}

export const kMaximumPaginatedPageLength = 10;
