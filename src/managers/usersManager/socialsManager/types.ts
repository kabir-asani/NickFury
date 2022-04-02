// Follow
export enum FollowFailure {
    UNKNOWN,
    FOLLOW_ALREADY_EXISTS,
    FOLLOWER_DOES_NOT_EXISTS,
    FOLLOWING_DOES_NOT_EXISTS
}

// Unfollow
export enum UnfollowFailure {
    UNKNOWN,
    FOLLOW_DOES_NOT_EXISTS,
    FOLLOWER_DOES_NOT_EXISTS,
    FOLLOWING_DOES_NOT_EXISTS
}

// FollowersFeedFailure
export enum FollowersFeedFailure {
    UNKNOWN,
    USER_DOES_NOT_EXISTS
}

// FollowingFeedFailure
export enum FollowingsFeedFailure {
    UNKNOWN,
    USER_DOES_NOT_EXISTS
}