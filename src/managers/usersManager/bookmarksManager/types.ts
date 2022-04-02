// Bookmark
export enum BookmarkFailure {
    UNKNOWN,
    BOOKMARK_DOES_NOT_EXISTS,
    AUTHOR_DOES_NOT_EXISTS,
    TWEET_DOES_NOT_EXISTS
}

// Feed
export enum BookmarksFeedFailure {
    UNKNOWN,
    AUTHOR_DOES_NOT_EXISTS
}

// Create Bookmark
export enum CreateBookmarkFailure {
    UNKNOWN,
    BOOKMARK_ALREADY_EXISTS,
    AUTHOR_DOES_NOT_EXISTS,
    TWEET_DOES_NOT_EXISTS
}

// Delete Bookmark
export enum DeleteBookmarkFailure {
    UNKNOWN,
    BOOKMARK_DOES_NOT_EXISTS,
    AUTHOR_DOES_NOT_EXISTS,
}