import { Session } from "../../../managers/sessionManager/models";
import { RouteSuccess } from "../../core/types";

// Log In
export class LogInRouteSuccess extends RouteSuccess {
    static readonly statusCode: 200;

    constructor(session: Session) {
        super(session);
    }
}

// Log Out
export class LogOutRouteSuccess extends RouteSuccess {
    static readonly statusCode: 200;

    constructor(data?: Object) {
        super(data || "Successfully logged out");
    }
}