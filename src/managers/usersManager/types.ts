// User
export enum UserFailure {
    UNKNOWN,
    USER_DOES_NOT_EXISTS
}

// Create
export enum CreateUserFailure {
    UNKNOWN,
    USER_ALREADY_EXISTS
}

// Update
export enum UpdateUserFailure {
    UNKNOWN,
    USER_DOES_NOT_EXISTS
}

// ExternalizeUser
export enum UserExternalsFailure {
    UNKNOWN,
    VIEWER_DOES_NOT_EXISTS
}