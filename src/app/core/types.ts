import { snakeCasize } from "../../utils/caser/caser";

// SUCCESS
export class RouteSuccess {
    data?: Object;

    constructor(data?: Object) {
        if (data !== undefined) {
            this.data = snakeCasize(data);
        }
    }
}

export class AllOkRouteSuccess extends RouteSuccess {
    static readonly statusCode = 200;

    constructor(data: Object) {
        super(data);
    }
}

export class CreationRouteSuccess extends RouteSuccess {
    static readonly statusCode = 201;

    constructor(data: Object) {
        super(data);
    }
}

export class NoContentRouteSuccess extends RouteSuccess {
    static readonly statusCode = 204;

    constructor() {
        super();
    }
}

// FAILURE
export class RouteFailure {
    reason: Object;

    constructor(reason: Object = {}) {
        this.reason = snakeCasize(reason);
    }
}

export class IncorrectParametersRouteFailure extends RouteFailure {
    static readonly statusCode = 400;

    constructor(reason?: Object) {
        super(reason || "Incorrect parameters");
    }
}

export class UnauthenticatedRouteFailure extends RouteFailure {
    static readonly statusCode = 401;

    constructor(reason?: Object) {
        super(reason || "Unauthenticated");
    }
}

export class ForbiddenRouteFailure extends RouteFailure {
    static readonly statusCode = 403;

    constructor(reason?: Object) {
        super(reason || "Forbidden");
    }
}

export class NoResourceRouteFailure extends RouteFailure {
    static readonly statusCode = 404;

    constructor(reason?: Object) {
        super(reason || "Non-existent");
    }
}

export class SemanticRouteFailure extends RouteFailure {
    static readonly statusCode = 422;

    constructor(reason?: Object) {
        super(reason || "Incorrect Semantically");
    }
}

export class InternalRouteFailure extends RouteFailure {
    static readonly statusCode = 500;

    constructor(reason?: Object) {
        super(reason || "Unknown");
    }
}

export class UnimplementedRouteFailure extends RouteFailure {
    static readonly statusCode = 501;

    constructor(reason?: Object) {
        super(reason || "Unimplemented");
    }
}