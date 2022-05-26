export enum TweetCreationFailureReason {
    unknown,
}

export enum TweetDeletionFailureReason {
    unknown,
    tweetWithThatIdDoesNotExists,
}

export enum PaginatedTweetsFailureReason {
    unknown,
    malformedParameters,
}

export enum TweetsFailureReason {
    unknown,
    missingTweets,
}

export enum PaginatedViewableTweetsFailureReason {
    unknown,
    malformedParameters,
}

export enum ViewableTweetsFailureReason {
    unknown,
    missingTweets,
}
