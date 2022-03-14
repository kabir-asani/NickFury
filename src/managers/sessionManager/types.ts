// MODELS
export interface Session {
    accessToken: String;
}

// REQUEST, RESPONSE

// Create Session
export interface CreateSessionSuccess {
    session: Session;
}

export interface CreateSessionFailure {
    reason: CreateSessionFailureReason;
}

export enum CreateSessionFailureReason {
    unknown
}

// Read Session
export interface ReadSessionSuccess {

}

export interface ReadSessionFailure {
    reason: ReadSessionFailureReason;
}

export enum ReadSessionFailureReason {
    unknown
}