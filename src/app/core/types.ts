export class RouteSuccess {
    data: Object;

    constructor(data: Object = {}) {
        this.data = data;
    }
}

export class RouteFailure {
    reason: Object;

    constructor(reason: Object = {}) {
        this.reason = reason;
    }
}