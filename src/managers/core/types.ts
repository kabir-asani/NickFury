export interface PaginationParameters {
    nextToken?: String;
    limit?: Number;
}

export interface ViewablesParameters {
    viewerId: String;
}

export interface Value<T> {
    [key: string]: T;
}

export interface Paginated<T> {
    readonly page: T[];
    readonly nextToken?: String;
}

export interface Credentials {
    readonly accessToken: String;
}

export const kMaximumPaginatedPageLength = 25;
