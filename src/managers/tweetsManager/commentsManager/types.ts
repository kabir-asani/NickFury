export enum CommentCreationFailureReason {
    unknown,
}

export enum CommentDeletionFailureReason {
    unknown,
    commentDoesNotExists,
}

export enum PaginatedCommentsFailureReason {
    unknown,
    malformedParameters,
}

export enum PaginatedViewableCommentsFailureReason {
    unknown,
    malformedParameters,
}
