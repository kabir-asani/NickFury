// Comment
export enum CommentFailure {
    UNKNOWN,
    COMMENT_DOES_NOT_EXISTS,
}

// CommentFeed
export enum CommentsFeedFailure {
    UNKNOWN,
    TWEET_DOES_NOT_EXISTS
}

// Add Comment
export enum AddCommentFailure {
    UNKNOWN,
    TWEET_DOES_NOT_EXISTS,
    AUTHOR_DOES_NOT_EXISTS,
    MALFORMED_COMMENT
}

// Remove Comment
export enum RemoveCommentFailure {
    UNKNOWN,
    COMMENT_DOES_NOT_EXISTS,
}


// ViewableComment
export enum ViewableCommentFailure {
    UNKNOWN,
    VIEWER_DOES_NOT_EXISTS
}