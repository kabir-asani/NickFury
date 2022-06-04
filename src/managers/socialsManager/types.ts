export enum FollowFailureReason {
    unknown,
    followingOneselfIsForbidden,
    followerDoesNotExists,
    followeeDoesNotExists,
    relationshipAlreadyExists,
}

export enum UnfollowFailureReason {
    unknown,
    unfollowingOneselfIsForbidden,
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
