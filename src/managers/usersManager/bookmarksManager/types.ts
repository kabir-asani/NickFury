// Bookmark
export enum BookmarkFailure {
    UNKNOWN,
    BOOKMARK_DOES_NOT_EXISTS
}

// Feed
export enum BookmarksFeedFailure {
    AUTHOR_DOES_NOT_EXISTS,
    UNKNOWN
}

// Create Bookmark
export enum CreateBookmarkFailure {
    UNKNOWN,
    AUTHOR_DOES_NOT_EXISTS,
    TWEET_DOES_NOT_EXISTS,
    BOOKMARK_ALREADY_EXISTS
}

// Delete Bookmark
export enum DeleteBookmarkFailure {
    UNKNOWN,
    BOOKMARK_DOES_NOT_EXISTS
}

// Viewable Bookmark
export enum ViewableBookmarkFailure {
    UNKNOWN,
    VIEWER_DOES_NOT_EXISTS,
}