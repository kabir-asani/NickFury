export enum LikeCreationFailureReason {
    unknown,
    likeAlreadyExists,
}

export enum LikeDeletionFailureReason {
    unknown,
    likeDoesNotExists,
}

export enum PaginatedLikesFailure {
    unknown,
    malformedParameters,
    missingLikes,
}

export enum PaginatedViewableLikesFailure {
    unknown,
    malformedParameters,
    missingLikes,
}
