export interface PaginationQuery {
    nextToken?: String;
    limit?: Number;
}

export class Paginated<T> {
    static readonly maximumPageLength = 25;

    readonly page: T[];
    readonly nextToken?: String;

    constructor(parameters: {
        page: T[];
        nextToken?: String;
    }) {
        this.page = parameters.page;
        this.nextToken = parameters.nextToken;
    }
}