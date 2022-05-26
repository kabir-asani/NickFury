export interface LikeReaction {
    id: String;
}

// Add Like
export enum AddLikeFailure {
    unknown,
}

// Remove Like
export enum RemoveLikeFailure {
    unknown,
}

// Likes
export enum PaginatedLikeReactionsFailure {
    unknown,
    malformedParameters,
}
