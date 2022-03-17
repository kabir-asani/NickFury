import { Session } from "../sessionManager/models";
// SUCCESS, FAILURE

// Log In
export interface LogInSuccess {
    session: Session;
}

export interface LogInFailure {
    reason: LogInFailureReason;
}

export enum LogInFailureReason {
    unknown,
    authProviderUnknown,
}

// Google Log In
export interface GoogleLogInSuccess extends LogInSuccess {

}

export interface GoogleLogInFailure extends LogInFailure {

}

// Log Out
export interface LogOutSuccess {

}

export interface LogOutFailure {
    reason: LogOutFailureReason;
}

export enum LogOutFailureReason {
    unknown
}