import DatabaseAssistant, {
    DBCollections,
} from "../../assistants/database/database";
import Dately from "../../utils/dately/dately";
import { Empty, Failure, Success } from "../../utils/typescriptx/typescriptx";
import {
    Bookmark,
    BookmarkViewables,
    ViewableBookmark,
    ViewableTweet,
} from "../core/models";
import {
    kMaximumPaginatedPageLength,
    Paginated,
    PaginationParameters,
    Value,
    ViewablesParameters,
} from "../core/types";
import {
    BookmarkCreationFailureReason,
    BookmarkDeletionFailureReason,
    BookmarksFailureReason,
    PaginatedBookmarksFailureReason,
    PaginatedViewableBookmarksFailureReason,
} from "./types";
import TweetsManager from "../tweetsManager/tweetsManager";
import logger, { LogLevel } from "../../utils/logger/logger";

export default class BookmarksManager {
    static readonly shared = new BookmarksManager();

    private constructor() {}

    private createIdentifier(parameters: {
        authorId: String;
        tweetId: String;
    }): String {
        return `${parameters.authorId}:${parameters.tweetId}`;
    }

    async exists(parameters: { id: String }): Promise<Boolean> {
        const bookmarskCollection = DatabaseAssistant.shared.collectionGroup(
            DBCollections.bookmarks
        );

        const bookmarksQuery = bookmarskCollection
            .where("id", "==", parameters.id.valueOf())
            .limit(1);

        const bookmarksQuerySnapshot = await bookmarksQuery.get();

        if (bookmarksQuerySnapshot.docs.length > 0) {
            return true;
        }

        return false;
    }

    async existsByDetails(parameters: {
        tweetId: String;
        authorId: String;
    }): Promise<Boolean> {
        const bookmarskCollection = DatabaseAssistant.shared.collectionGroup(
            DBCollections.bookmarks
        );

        const id = this.createIdentifier({
            tweetId: parameters.tweetId,
            authorId: parameters.authorId,
        });

        const bookmarksQuery = bookmarskCollection
            .where("id", "==", id)
            .limit(1);

        const bookmarksQuerySnapshot = await bookmarksQuery.get();

        if (bookmarksQuerySnapshot.docs.length > 0) {
            return true;
        }

        return false;
    }

    async bookmarkStatuses(parameters: {
        authorId: String;
        tweetIds: String[];
    }): Promise<Value<Boolean>> {
        if (parameters.tweetIds.length === 0) {
            return {};
        }

        const bookmarkDocumentRefs = parameters.tweetIds.map((tweetId) => {
            const id = this.createIdentifier({
                authorId: parameters.authorId,
                tweetId: tweetId,
            });

            const bookmarkDocumentPath =
                DBCollections.users +
                `/${parameters.authorId}/` +
                DBCollections.bookmarks +
                `/${id}`;

            const bookmarkDocumentRef =
                DatabaseAssistant.shared.doc(bookmarkDocumentPath);

            return bookmarkDocumentRef;
        });

        const bookmarkDocuments = await DatabaseAssistant.shared.getAll(
            ...bookmarkDocumentRefs
        );

        const bookmarkStatuses: Value<Boolean> = {};

        bookmarkDocuments.forEach((bookmarkDocument) => {
            const tweetId = bookmarkDocument.id.split(":")[1];

            bookmarkStatuses[tweetId] = bookmarkDocument.exists;
        });

        return bookmarkStatuses;
    }

    async create(parameters: {
        tweetId: String;
        authorId: String;
    }): Promise<Success<Bookmark> | Failure<BookmarkCreationFailureReason>> {
        const isBookmarkExists = await this.existsByDetails({
            tweetId: parameters.tweetId,
            authorId: parameters.authorId,
        });

        if (isBookmarkExists) {
            const reply = new Failure<BookmarkCreationFailureReason>(
                BookmarkCreationFailureReason.bookmarkAlreadyExists
            );

            return reply;
        }

        const id = this.createIdentifier({
            authorId: parameters.authorId,
            tweetId: parameters.tweetId,
        });

        const bookmark: Bookmark = {
            id: id,
            tweetId: parameters.tweetId,
            authorId: parameters.authorId,
            creationDate: Dately.shared.now(),
        };

        const bookmarkDocumentPath =
            DBCollections.users +
            `/${parameters.authorId}/` +
            DBCollections.bookmarks +
            bookmark.id;

        const bookmarkDocumentRef =
            DatabaseAssistant.shared.doc(bookmarkDocumentPath);

        try {
            await bookmarkDocumentRef.create(bookmark);

            const reply = new Success<Bookmark>(bookmark);

            return reply;
        } catch (e) {
            logger(e, LogLevel.attention, [this, this.create]);

            const reply = new Failure<BookmarkCreationFailureReason>(
                BookmarkCreationFailureReason.unknown
            );

            return reply;
        }
    }

    async delete(parameters: {
        bookmarkId: String;
    }): Promise<Success<Empty> | Failure<BookmarkDeletionFailureReason>> {
        const bookmark = await this.bookmark({
            bookmarkId: parameters.bookmarkId,
        });

        if (bookmark === null) {
            const reply = new Failure<BookmarkDeletionFailureReason>(
                BookmarkDeletionFailureReason.bookmarkDoesNotExists
            );

            return reply;
        }

        try {
            const bookmarkDocumentPath =
                DBCollections.users +
                `/${bookmark.authorId}/` +
                DBCollections.bookmarks +
                `/${bookmark.id}`;

            const bookmarkDocumentRef =
                DatabaseAssistant.shared.doc(bookmarkDocumentPath);

            await bookmarkDocumentRef.delete();

            const reply = new Success<Empty>({});

            return reply;
        } catch (e) {
            logger(e, LogLevel.attention, [this, this.delete]);

            const reply = new Failure<BookmarkDeletionFailureReason>(
                BookmarkDeletionFailureReason.unknown
            );

            return reply;
        }
    }

    async bookmark(parameters: {
        bookmarkId: String;
    }): Promise<Bookmark | null> {
        const bookmarskCollection = DatabaseAssistant.shared.collectionGroup(
            DBCollections.bookmarks
        );

        const bookmarksQuery = bookmarskCollection
            .where("id", "==", parameters.bookmarkId.valueOf())
            .limit(1);

        const bookmarksQuerySnapshot = await bookmarksQuery.get();

        if (bookmarksQuerySnapshot.docs.length > 0) {
            const bookmark =
                bookmarksQuerySnapshot.docs[0].data() as unknown as Bookmark;

            return bookmark;
        }

        return null;
    }

    async viewableBookmark(
        parameters: { bookmarkId: String } & ViewablesParameters
    ): Promise<ViewableBookmark | null> {
        const bookmark = await this.bookmark({
            bookmarkId: parameters.bookmarkId,
        });

        if (bookmark === null) {
            return null;
        }

        const bookmarkViewables = await this.bookmarkViewables({
            tweetId: bookmark.tweetId,
            viewerId: parameters.viewerId,
        });

        if (bookmarkViewables === null) {
            return null;
        }

        const viewableBookmark: ViewableBookmark = {
            ...bookmark,
            viewables: bookmarkViewables,
        };

        return viewableBookmark;
    }

    private async bookmarkViewables(
        parameters: {
            tweetId: String;
        } & ViewablesParameters
    ): Promise<BookmarkViewables | null> {
        const viewableTweet = await TweetsManager.shared.viewableTweet({
            tweetId: parameters.tweetId,
            viewerId: parameters.viewerId,
        });

        if (viewableTweet === null) {
            return null;
        }

        const viewables: BookmarkViewables = {
            tweet: viewableTweet as ViewableTweet,
        };

        return viewables;
    }

    async paginatedBookmarksOf(
        parameters: {
            userId: String;
        } & PaginationParameters
    ): Promise<
        Success<Paginated<Bookmark>> | Failure<PaginatedBookmarksFailureReason>
    > {
        const bookmarksCollectionPath =
            DBCollections.users +
            `/${parameters.userId}/` +
            DBCollections.bookmarks;

        const bookmarksCollection = DatabaseAssistant.shared.collection(
            bookmarksCollectionPath
        );

        const limit =
            parameters.limit?.valueOf() || kMaximumPaginatedPageLength;

        let query = bookmarksCollection
            .orderBy("creationDate")
            .limit(limit + 1);

        if (parameters.nextToken !== undefined) {
            query = query.startAt(parameters.nextToken);
        }

        try {
            const querySnapshot = await query.get();

            if (querySnapshot.empty) {
                const paginatedBookmarks: Paginated<Bookmark> = {
                    page: [],
                };

                const reply = new Success<Paginated<Bookmark>>(
                    paginatedBookmarks
                );

                return reply;
            }

            let nextToken = undefined;

            if (querySnapshot.docs.length === limit + 1) {
                const lastDocument = querySnapshot.docs.pop();

                if (lastDocument !== undefined) {
                    nextToken = (lastDocument.data() as unknown as Bookmark)
                        .creationDate;
                }
            }

            const bookmarks = querySnapshot.docs.map((queryDocument) => {
                const bookmark = queryDocument.data() as unknown as Bookmark;

                return bookmark;
            });

            const paginatedFollowers: Paginated<Bookmark> = {
                page: bookmarks,
                nextToken: nextToken,
            };

            const reply = new Success<Paginated<Bookmark>>(paginatedFollowers);

            return reply;
        } catch (e) {
            logger(e, LogLevel.attention, [this, this.paginatedBookmarksOf]);

            const reply = new Failure<PaginatedBookmarksFailureReason>(
                PaginatedBookmarksFailureReason.unknown
            );

            return reply;
        }
    }

    async paginatedViewableBookmarksOf(
        parameters: {
            userId: String;
        } & ViewablesParameters &
            PaginationParameters
    ): Promise<
        | Success<Paginated<ViewableBookmark>>
        | Failure<PaginatedViewableBookmarksFailureReason>
    > {
        const paginatedBookmarksResult = await this.paginatedBookmarksOf({
            userId: parameters.userId,
            limit: parameters.limit,
            nextToken: parameters.nextToken,
        });

        if (paginatedBookmarksResult instanceof Failure) {
            switch (paginatedBookmarksResult.reason) {
                case PaginatedBookmarksFailureReason.malformedParameters: {
                    const reply =
                        new Failure<PaginatedViewableBookmarksFailureReason>(
                            PaginatedViewableBookmarksFailureReason.malformedParameters
                        );

                    return reply;
                }
                default: {
                    const reply =
                        new Failure<PaginatedViewableBookmarksFailureReason>(
                            PaginatedViewableBookmarksFailureReason.unknown
                        );

                    return reply;
                }
            }
        }

        const paginatedBookmarks = paginatedBookmarksResult.data;

        if (paginatedBookmarks.page.length === 0) {
            const paginatedViewableBookmarks: Paginated<ViewableBookmark> = {
                page: [],
            };

            const reply = new Success<Paginated<ViewableBookmark>>(
                paginatedViewableBookmarks
            );

            return reply;
        }

        const viewableTweetsResult = await TweetsManager.shared.viewableTweets({
            tweetIdentifiers: paginatedBookmarks.page.map(
                (bookmark) => bookmark.tweetId
            ),
            viewerId: parameters.viewerId,
        });

        if (viewableTweetsResult instanceof Failure) {
            const reply = new Failure<PaginatedViewableBookmarksFailureReason>(
                PaginatedViewableBookmarksFailureReason.unknown
            );

            return reply;
        }

        const viewableTweets = viewableTweetsResult.data;

        const viewableBookmarks = paginatedBookmarks.page.map((bookmark) => {
            const bookmarkViewables: BookmarkViewables = {
                tweet: viewableTweets[bookmark.tweetId.valueOf()],
            };

            const viewableBookmark: ViewableBookmark = {
                ...bookmark,
                viewables: bookmarkViewables,
            };

            return viewableBookmark;
        });

        const paginatedViewableBookmarks: Paginated<ViewableBookmark> = {
            page: viewableBookmarks,
            nextToken: paginatedBookmarks.nextToken,
        };

        const reply = new Success<Paginated<ViewableBookmark>>(
            paginatedViewableBookmarks
        );

        return reply;
    }
}
