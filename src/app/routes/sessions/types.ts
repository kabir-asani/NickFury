import { Session } from "../../../managers/sessionManager/models";
import { OkRouteSuccess } from "../../core/types";

// Log In
export class LogInRouteSuccess extends OkRouteSuccess {
    static readonly statusCode: 200;

    constructor(session: Session) {
        super(session);
    }
}

// Log Out
export class LogOutRouteSuccess extends OkRouteSuccess {
    static readonly statusCode: 200;

    constructor(data?: Object) {
        super(data || "Successfully logged out");
    }
}