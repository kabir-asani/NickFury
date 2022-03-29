import { snakeCasize } from "../../utils/caser/caser";

export class RouteSuccess {
    static readonly statusCode = 200;
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

export class InternalRouteFailure extends RouteFailure {
    static readonly statusCode = 500;

    constructor(reason?: Object) {
        super(reason || "Something Went Wrong");
    }
}

export class ForbiddenAccessRouteFailure extends RouteFailure {
    static readonly statusCode = 403;

    constructor(reason?: Object) {
        super(reason || "Forbidden Access");
    }
}

export class IncorrectAccessTokenRouteFailure extends RouteFailure {
    static readonly statusCode = 400;

    constructor(reason?: Object) {
        super(reason || "Incorrect Access Token");
    }
}

export class MissingAccessTokenRouteFailure extends RouteFailure {
    static readonly statusCode = 401;

    constructor(reason?: Object) {
        super(reason || "Missing Access Token");
    }
}

export class IllegalAccessTokenRouteFailure extends RouteFailure {
    static readonly statusCode = 401;

    constructor(reason?: Object) {
        super(reason || "Illegal Access Token");
    }
}

export class MissingResourceRouteFailure extends RouteFailure {
    static readonly statusCode = 404;

    constructor(reason?: Object) {
        super(reason || "Resource Missing");
    }
}

export class BadRequestRouteFailure extends RouteFailure {
    static readonly statusCode = 400;

    constructor(reason?: Object) {
        super(reason || "Bad Request");
    }
}