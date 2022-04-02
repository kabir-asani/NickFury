export class BookmarkSuccess { }
export class BookmarkFailure { }

// Create Bookmark
export enum CreateBookmarkFailure {
    UNKNOWN,
    ALREADY_EXISTS
}

// Delete Bookmark
export enum DeleteBookmarkFailure {
    UNKNOWN,
    DOES_NOT_EXISTS
}