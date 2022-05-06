import { User } from "../usersManager/models";

// Log In
export interface LogInSuccess {
    readonly credentials: {
        accessToken: String;
    };
    readonly user: User;
}

export enum LogInFailure {
    UNKNOWN,
    INCORECT_ACCESS_TOKEN,
}

// Log Out
export enum LogOutFailure {
    UNKNOWN
}