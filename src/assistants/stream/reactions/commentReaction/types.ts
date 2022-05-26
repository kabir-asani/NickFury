export interface CommentReaction {
    id: String;
}

// Add Comment
export enum AddCommentReactionFailureReason {
    UNKNOWN,
}

// Remove Comment
export enum RemoveCommentReactionFailureReason {
    unknown,
}

// Comments
export enum PaginatedCommentReactionsFailure {
    unknown,
    malformedParameters,
}
