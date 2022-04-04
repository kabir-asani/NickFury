// Like
export enum LikeFailure {
    UNKNOWN,
    LIKE_DOES_NOT_EXISTS,
}

// LikeFeed
export enum LikesFeedFailure {
    UNKNOWN,
    TWEET_DOES_NOT_EXISTS
}

// CreateLike
export enum AddLikeFailure {
    UNKNOWN,
    TWEET_DOES_NOT_EXISTS,
    AUTHOR_DOES_NOT_EXISTS,
    LIKE_ALREADY_EXISTS,
}

// DeleteLike
export enum RemoveLikeFailure {
    UNKNOWN,
    LIKE_DOES_NOT_EXISTS,
}