import { assert } from "console";
import { Empty, Failure, Success } from "../../utils/typescriptx/typescriptx";
import { Bookmark, BookmarkViewables, ViewableBookmark } from "../core/models";
import { Paginated } from "../core/types";
import { BookmarkCreationFailureReason, BookmarkDeletionFailureReason } from "./types";

export class BookmarksManager {
    static readonly shared = new BookmarksManager();

    private constructor() { }

    async exists(parameters: {
        bookmarkId?: String;
        bookmarkDetails?: {
            tweetId: String;
            authorId: String;
        }
    }): Promise<Boolean> {
        // TODO: Implement `BookmarksManager.exists`
        assert(
            parameters.bookmarkId !== undefined || parameters.bookmarkDetails !== undefined,
            "Atleast bookmarkId or bookmarkDetails should be present"
        );

        if (parameters.bookmarkId !== undefined) {

        }

        if (parameters.bookmarkDetails !== undefined) {

        }

        return false;
    }

    async create(parameters: {
        tweetId: String;
        authorId: String;
    }): Promise<Success<Bookmark> | Failure<BookmarkCreationFailureReason>> {
        // TODO: Implement `BookmarksManager.create`
        const result = new Failure<BookmarkCreationFailureReason>(
            BookmarkCreationFailureReason.unknown
        );

        return result;
    }

    async delete(parameters: {
        bookmarkId: String
    }): Promise<Success<Empty> | Failure<BookmarkDeletionFailureReason>> {
        // TODO: Implement `BookmarksManager.delete`
        const result = new Failure<BookmarkDeletionFailureReason>(
            BookmarkDeletionFailureReason.unknown
        );

        return result;
    }

    async bookmarks(parameters: {
        userId: String;
    }): Promise<Paginated<ViewableBookmark> | null> {
        // TODO: Implement `BookmarksManager.bookmars`
        return null;
    }

    private async viewables(parameters: {
        viewerId: String;
    }): Promise<BookmarkViewables | null> {
        // TODO: Implement `BookmarksManager.viewables`
        return null;
    }
}