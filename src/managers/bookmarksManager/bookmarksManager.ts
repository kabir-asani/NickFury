import {
    DatabaseAssistant,
    DBCollections,
} from "../../assistants/database/database";
import StreamAssistant from "../../assistants/stream/stream";
import { Dately } from "../../utils/dately/dately";
import {
    Empty,
    Failure,
    Success,
    valuesOf,
} from "../../utils/typescriptx/typescriptx";
import {
    Bookmark,
    BookmarkViewables,
    ViewableBookmark,
    ViewableTweet,
} from "../core/models";
import {
    Paginated,
    PaginationParameters,
    Value,
    ViewablesParameters2,
} from "../core/types";
import {
    BookmarkCreationFailureReason,
    BookmarkDeletionFailureReason,
    BookmarksFailureReason,
    PaginatedBookmarksFailureReason,
    PaginatedViewableBookmarksFailureReason,
} from "./types";
import { TweetsManager } from "../tweetsManager/tweetsManager";
import { BookmarkActivitiesFailureReason } from "../../assistants/stream/feeds/bookmarkFeed/types";

export class BookmarksManager {
    static readonly shared = new BookmarksManager();

    private constructor() {}

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

        const bookmarksQuery = bookmarskCollection
            .where("tweetId", "==", parameters.tweetId.valueOf())
            .where("authorId", "==", parameters.authorId.valueOf())
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
        const bookmarkStatuses: Value<Boolean> = {};

        for (let tweetId of parameters.tweetIds) {
            const isExists = await this.existsByDetails({
                authorId: parameters.authorId,
                tweetId: tweetId,
            });

            bookmarkStatuses[tweetId.valueOf()] = isExists;
        }

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

        const bookmarkAdditionResult =
            await StreamAssistant.shared.bookmarkFeed.addBookmarkActivity({
                authorId: parameters.authorId,
                tweetId: parameters.tweetId,
            });

        if (bookmarkAdditionResult instanceof Failure) {
            const reply = new Failure<BookmarkCreationFailureReason>(
                BookmarkCreationFailureReason.unknown
            );

            return reply;
        }

        const bookmarkActivity = bookmarkAdditionResult.data;

        const bookmark: Bookmark = {
            id: bookmarkActivity.bookmarkId,
            tweetId: bookmarkActivity.tweetId,
            authorId: bookmarkActivity.authorId,
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
        } catch {
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

        const bookmarkRemovalResult =
            await StreamAssistant.shared.bookmarkFeed.removeBookmarkActivity({
                authorId: bookmark.authorId,
                bookmarkId: bookmark.id,
            });

        if (bookmarkRemovalResult instanceof Failure) {
            const reply = new Failure<BookmarkDeletionFailureReason>(
                BookmarkDeletionFailureReason.unknown
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
        } catch {
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
        parameters: { bookmarkId: String } & ViewablesParameters2
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
        } & ViewablesParameters2
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

    async bookmarks(parameters: {
        userId: String;
        identifiers: String[];
    }): Promise<Success<Value<Bookmark>> | Failure<BookmarksFailureReason>> {
        const bookmarkDocumentRefs = parameters.identifiers.map(
            (bookmarkId) => {
                const bookmarkDocumentPath =
                    DBCollections.users +
                    `/${parameters.userId}/` +
                    DBCollections.bookmarks +
                    `/${bookmarkId}`;

                const bookmarkDocumentRef =
                    DatabaseAssistant.shared.doc(bookmarkDocumentPath);

                return bookmarkDocumentRef;
            }
        );

        const bookmarkDocuments = await DatabaseAssistant.shared.getAll(
            ...bookmarkDocumentRefs
        );

        const bookmarks: Value<Bookmark> = {};

        for (let bookmarkDocument of bookmarkDocuments) {
            if (!bookmarkDocument.exists) {
                const reply = new Failure<BookmarksFailureReason>(
                    BookmarksFailureReason.missingBookmarks
                );

                return reply;
            }

            const bookmark = bookmarkDocument.data() as unknown as Bookmark;

            bookmarks[bookmark.id.valueOf()] = bookmark;
        }

        const reply = new Success<Value<Bookmark>>(bookmarks);

        return reply;
    }

    async paginatedBookmarksOf(
        parameters: {
            userId: String;
        } & PaginationParameters
    ): Promise<
        Success<Paginated<Bookmark>> | Failure<PaginatedBookmarksFailureReason>
    > {
        const bookmarkActivitiesResult =
            await StreamAssistant.shared.bookmarkFeed.activities({
                authorId: parameters.userId,
                limit: parameters.limit,
                nextToken: parameters.nextToken,
            });

        if (bookmarkActivitiesResult instanceof Failure) {
            switch (bookmarkActivitiesResult.reason) {
                case BookmarkActivitiesFailureReason.malformedParameters: {
                    const reply = new Failure<PaginatedBookmarksFailureReason>(
                        PaginatedBookmarksFailureReason.malformedParameters
                    );

                    return reply;
                }
                default: {
                    const reply = new Failure<PaginatedBookmarksFailureReason>(
                        PaginatedBookmarksFailureReason.unknown
                    );

                    return reply;
                }
            }
        }

        const bookmarkActivities = bookmarkActivitiesResult.data;

        if (bookmarkActivities.page.length === 0) {
            const paginatedBookmarks: Paginated<Bookmark> = {
                page: [],
            };

            const reply = new Success<Paginated<Bookmark>>(paginatedBookmarks);

            return reply;
        }

        const bookmarksResult = await this.bookmarks({
            userId: parameters.userId,
            identifiers: bookmarkActivities.page.map((bookmarkActivity) => {
                return bookmarkActivity.bookmarkId;
            }),
        });

        if (bookmarksResult instanceof Failure) {
            const reply = new Failure<PaginatedBookmarksFailureReason>(
                PaginatedBookmarksFailureReason.unknown
            );

            return reply;
        }

        const bookmarks = bookmarksResult.data;

        const paginatedBookmarks: Paginated<Bookmark> = {
            page: valuesOf(bookmarks),
            nextToken: bookmarkActivities.nextToken,
        };

        const reply = new Success<Paginated<Bookmark>>(paginatedBookmarks);

        return reply;
    }

    async paginatedViewableBookmarksOf(
        parameters: {
            userId: String;
        } & ViewablesParameters2 &
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
            identifiers: paginatedBookmarks.page.map(
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
