// Like
export enum CommentFailure {
    UNKNOWN,
    COMMENT_DOES_NOT_EXISTS,
}

// LikeFeed
export enum CommentsFeedFailure {
    UNKNOWN,
    TWEET_DOES_NOT_EXISTS
}

// CreateLike
export enum AddCommentFailure {
    UNKNOWN,
    TWEET_DOES_NOT_EXISTS,
    AUTHOR_DOES_NOT_EXISTS,
    MISFORMED_COMMENT
}

// DeleteLike
export enum RemoveCommentFailure {
    UNKNOWN,
    COMMENT_DOES_NOT_EXISTS,
}