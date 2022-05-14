export interface Empty { }

export class Success<Data> {
    data: Data;

    constructor(data: Data) {
        this.data = data;
    }
}

export class Failure<Reason> {
    reason: Reason;

    constructor(reason: Reason) {
        this.reason = reason;
    }
}