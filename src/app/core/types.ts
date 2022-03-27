import { snakeCasize } from "../../utils/caser/caser";

export class RouteSuccess {
    data: Object;

    constructor(data: Object = {}) {
        this.data = snakeCasize(data);
    }
}

export class RouteFailure {
    reason: Object;

    constructor(reason: Object = {}) {
        this.reason = snakeCasize(reason);
    }
}