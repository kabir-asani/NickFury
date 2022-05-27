export enum FollowFailureReason {
    unknown,
    followerDoesNotExists,
    followeeDoesNotExists,
    relationshipAlreadyExists,
}

export enum UnfollowFailureReason {
    unknown,
    relationshipDoesNotExists,
}

export enum PaginatedFolloweesFailureReason {
    unknown,
}

export enum PaginatedFollowersFailureReason {
    unknown,
}

export enum PaginatedViewableFolloweesFailureReason {
    unknown,
}

export enum PaginatedViewableFollowersFailureReason {
    unknown,
}
