import { Samaritan } from "./models";

// Create Samaritan
export interface SamaritanCreateSuccess {
    samaritan: Samaritan;
}

export interface SamaritanCreateFailure {
    reason: SamaritanCreateFailureReason;
}

export enum SamaritanCreateFailureReason {
    unknown,
    samaritanAlreadyPresent
}