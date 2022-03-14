import { Session } from "../sessionManager/types";

// MODELS
export enum AuthProvider {
    google = 'google',
    apple = 'apple'
}

// SUCCESS, FAILURE

// Log In
export interface LogInSuccess {
    session: Session;
}

export interface LogInFailure {
    reason: LogInFailureReason
}

export enum LogInFailureReason {
    unknown,
    authProviderUnknown
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