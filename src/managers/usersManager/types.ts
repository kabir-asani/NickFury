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

// Viewable
export enum ViewableUserFailure {
    UNKNOWN,
    VIEWER_DOES_NOT_EXISTS
}

// Seach
export enum SearchUsersFailure {
    UNKNOWN,
    MALFORMED_KEYWORD
}