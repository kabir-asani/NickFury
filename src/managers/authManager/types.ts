export enum AuthProvider {
    google = 'google',
    apple = 'apple'
}

export interface Session {
    accessToken: String;
}

export interface LogInSuccess {
    session: Session;
}

export enum LogInFailureReason {
    unknown,
    authProviderUnknown
}

export interface LogInFailure {
    reason: LogInFailureReason
}