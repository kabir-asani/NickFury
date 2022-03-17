import { Session } from "./models";

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

// Delete Session
export interface DeleteSessionSuccess {
    
}

export interface DeleteSessionFailure {
    reason: DeleteSessionFailureReason;
}

export enum DeleteSessionFailureReason {
    unknown
}