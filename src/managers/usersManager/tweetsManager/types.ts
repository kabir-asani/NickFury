// Tweet
export enum TweetFailure {
    UNKNOWN,
    AUTHOR_DOES_NOT_EXISTS,
    TWEET_DOES_NOT_EXISTS,
}

// Feed
export enum TweetsFeedFailure {
    UNKNOWN,
    AUTHOR_DOES_NOT_EXISTS,
}

// Create Tweet
export enum CreateTweetFailure {
    UNKNOWN,
    AUTHOR_DOES_NOT_EXISTS,
}

// Delete Tweet
export enum DeleteTweetFailure {
    UNKNOWN,
    TWEET_DOES_NOT_EXISTS,
}