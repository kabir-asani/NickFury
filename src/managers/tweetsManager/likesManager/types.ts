export enum LikeCreationFailureReason {
    unknown,
    likeAlreadyExists,
}

export enum LikeDeletionFailureReason {
    unknown,
    likeDoesNotExists,
}

export enum PaginatedLikesFailureReason {
    unknown,
    malformedParameters,
}

export enum PaginatedViewableLikesFailureReason {
    unknown,
    malformedParameters,
}
