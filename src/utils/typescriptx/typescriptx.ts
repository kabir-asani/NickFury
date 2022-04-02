export interface Empty { }

export class Success<D> {
    data: D;

    constructor(data: D) {
        this.data = data;
    }
}

export class Failure<R> {
    reason: R;

    constructor(reason: R) {
        this.reason = reason;
    }
}