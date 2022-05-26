export enum BookmarkCreationFailureReason {
    unknown,
    bookmarkAlreadyExists,
}

export enum BookmarkDeletionFailureReason {
    unknown,
    bookmarkDoesNotExists,
}

export enum BookmarksFailureReason {
    unknown,
    missingBookmarks,
}

export enum ViewableBookmarksFailureReason {
    unknown,
    missingBookmarks,
}

export enum PaginatedBookmarksFailureReason {
    unknown,
    malformedParameters,
}

export enum PaginatedViewableBookmarksFailureReason {
    unknown,
    malformedParameters,
}
