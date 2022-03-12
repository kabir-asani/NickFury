export enum DatabaseWriteFailureReason {
    unknown,
    documentCannotBeOverwritten
}

export enum DatabaseReadFailureReason {
    unknown,
    documentNotFound
}

export enum DatabaseDeleteFailureReason {
    unknown,
    documentNotFound
}