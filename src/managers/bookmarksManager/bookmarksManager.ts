import { DatabaseAssistant, DatabaseCollections } from "../../assistants/database/database";
import { StreamAssistant } from "../../assistants/stream/stream";
import { Dately } from "../../utils/dately/dately";
import { Empty, Failure, Success } from "../../utils/typescriptx/typescriptx";
import { Bookmark, BookmarkViewables, ViewableBookmark, ViewableTweet } from "../core/models";
import { Paginated, PaginationParameters, ViewablesParameters2 } from "../core/types";
import { BookmarkCreationFailureReason, BookmarkDeletionFailureReason } from "./types";
import { TweetsManager } from "../tweetsManager/tweetsManager";

export class BookmarksManager {
    static readonly shared = new BookmarksManager();

    private constructor() { }

    async exists(parameters: {
        id: String;
    }): Promise<Boolean> {
        const bookmarskCollection = DatabaseAssistant.shared.collectionGroup(DatabaseCollections.bookmarks);

        const bookmarksQuery = bookmarskCollection
            .where(
                "id",
                "==",
                parameters.id.valueOf()
            )
            .limit(1);

        try {
            const bookmarksQuerySnapshot = await bookmarksQuery.get();

            if (bookmarksQuerySnapshot.docs.length > 0) {
                return true;
            } else {
                return false;
            }
        } catch {
            return false;
        }
    }

    async existsByDetails(parameters: {
        tweetId: String;
        authorId: String;
    }): Promise<Boolean> {
        const bookmarskCollection = DatabaseAssistant.shared.collectionGroup(DatabaseCollections.bookmarks);

        const bookmarksQuery = bookmarskCollection
            .where(
                "tweetId",
                "==",
                parameters.tweetId.valueOf()
            )
            .where(
                "authorId",
                "==",
                parameters.authorId.valueOf()
            )
            .limit(1);

        const bookmarksQuerySnapshot = await bookmarksQuery.get();

        return bookmarksQuerySnapshot.docs.length > 0;
    }

    async bookmarkedStatuses(parameters: {
        authorId: String;
        tweetIds: String[]
    }): Promise<{ [key: string]: Boolean }> {
        const bookmarkStatuses: { [key: string]: Boolean } = {};

        for (let tweetId of parameters.tweetIds) {
            const isExists = await this.existsByDetails({
                authorId: parameters.authorId,
                tweetId: tweetId
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
            authorId: parameters.authorId
        });

        if (isBookmarkExists) {
            const reply = new Failure<BookmarkCreationFailureReason>(
                BookmarkCreationFailureReason.bookmarkAlreadyExists
            );

            return reply;
        }

        const bookmarkAddition = await StreamAssistant.shared.bookmarkFeed.addBookmarkActivity({
            authorId: parameters.authorId,
            tweetId: parameters.tweetId
        });

        if (bookmarkAddition instanceof Failure) {
            const reply = new Failure<BookmarkCreationFailureReason>(
                BookmarkCreationFailureReason.unknown
            );

            return reply;
        }

        const bookmarksCollection = DatabaseAssistant.shared.collection(
            DatabaseCollections.users
            + "/" + parameters.authorId.valueOf() + "/" +
            DatabaseCollections.bookmarks
        );

        const bookmark: Bookmark = {
            id: bookmarkAddition.data.bookmarkId,
            tweetId: bookmarkAddition.data.tweetId,
            authorId: bookmarkAddition.data.authorId,
            creationDate: Dately.shared.now()
        };

        const bookmarkDocumentRef = bookmarksCollection.doc(bookmark.id.valueOf());

        try {
            await bookmarkDocumentRef.create(bookmark);

            const reply = new Success<Bookmark>(
                bookmark
            );

            return reply;
        } catch {
            const reply = new Failure<BookmarkCreationFailureReason>(
                BookmarkCreationFailureReason.unknown
            );

            return reply;
        }
    }

    async delete(parameters: {
        bookmarkId: String
    }): Promise<Success<Empty> | Failure<BookmarkDeletionFailureReason>> {
        const bookmarskCollection = DatabaseAssistant.shared.collectionGroup(DatabaseCollections.bookmarks);

        let bookmarksQuery = bookmarskCollection
            .where(
                "id",
                "==",
                parameters.bookmarkId.valueOf()
            )
            .limit(1);

        const bookmarksQuerySnapshot = await bookmarksQuery.get();

        if (bookmarksQuerySnapshot.docs.length > 0) {
            const bookmarkDocumentRef = bookmarksQuerySnapshot.docs[0].ref;
            const bookmark = bookmarksQuerySnapshot.docs[0].data() as unknown as Bookmark;

            const bookmarkRemoval = await StreamAssistant.shared.bookmarkFeed.removeBookmarkActivity({
                authorId: bookmark.authorId,
                bookmarkId: bookmark.id
            });

            if (bookmarkRemoval instanceof Failure) {
                const reply = new Failure<BookmarkDeletionFailureReason>(
                    BookmarkDeletionFailureReason.unknown
                );

                return reply;
            }

            try {
                await bookmarkDocumentRef.delete();

                const reply = new Success<Empty>({});

                return reply;
            } catch {
                const reply = new Failure<BookmarkDeletionFailureReason>(
                    BookmarkDeletionFailureReason.unknown
                );

                return reply;
            }
        } else {
            const reply = new Failure<BookmarkDeletionFailureReason>(
                BookmarkDeletionFailureReason.bookmarkDoesNotExists
            );

            return reply;
        }
    }

    async bookmarks(parameters: {
        userId: String;
    } & PaginationParameters
    ): Promise<Paginated<Bookmark> | null> {
        const bookmarkActivities = await StreamAssistant.shared.bookmarkFeed.activities({
            authorId: parameters.userId,
            limit: parameters.limit,
            nextToken: parameters.nextToken
        });

        if (bookmarkActivities === null) {
            return null;
        }

        if (bookmarkActivities.page.length === 0) {
            const reply: Paginated<Bookmark> = {
                page: []
            };

            return reply;
        }

        const bookmarkDocumentRefs = bookmarkActivities.page.map((bookmarkActivity) => {
            const bookmarksCollection = DatabaseAssistant.shared.collection(
                DatabaseCollections.users
                + "/" + parameters.userId.valueOf() + "/" +
                DatabaseCollections.bookmarks
            );
            const bookmarkDocumentRef = bookmarksCollection.doc(bookmarkActivity.bookmarkId.valueOf());

            return bookmarkDocumentRef;
        });

        const bookmarkDocuments = await DatabaseAssistant.shared.getAll(...bookmarkDocumentRefs);

        if (bookmarkDocuments.length === 0) {
            const reply: Paginated<Bookmark> = {
                page: []
            };

            return reply;
        } else {
            const bookmarks = bookmarkDocuments.map((bookmarkDocument) => {
                const bookmark = bookmarkDocument.data() as unknown as Bookmark;

                return bookmark;
            });

            const reply: Paginated<Bookmark> = {
                page: bookmarks,
                nextToken: bookmarkActivities.nextToken
            };

            return reply;
        }
    }

    async viewableBookmarks(parameters: {
        userId: String;
    } & ViewablesParameters2 & PaginationParameters
    ): Promise<Paginated<ViewableBookmark> | null> {
        const bookmarks = await this.bookmarks({
            userId: parameters.userId,
            limit: parameters.limit,
            nextToken: parameters.nextToken
        });

        if (bookmarks !== null) {
            if (bookmarks.page.length === 0) {
                const reply: Paginated<ViewableBookmark> = {
                    page: []
                };

                return reply;
            }

            const viewablesTweets = await TweetsManager.shared.viewableTweetsByIds({
                ids: bookmarks.page.map((bookmark) => bookmark.tweetId),
                viewerId: parameters.viewerId
            });

            if (viewablesTweets !== null) {
                const viewableBookmarks = bookmarks.page.map((bookmark) => {
                    const bookmarkViewables: BookmarkViewables = {
                        tweet: viewablesTweets[bookmark.tweetId.valueOf()]
                    };

                    const viewableBookmark: ViewableBookmark = {
                        ...bookmark,
                        viewables: bookmarkViewables
                    };

                    return viewableBookmark;
                });

                const reply: Paginated<ViewableBookmark> = {
                    page: viewableBookmarks,
                    nextToken: bookmarks.nextToken
                };

                return reply;
            } else {
                return null;
            }
        } else {
            return null;
        }
    }

    private async viewables(parameters: {
        tweetId: String;
        viewerId: String;
    }): Promise<BookmarkViewables | null> {
        const viewableTweet = await TweetsManager.shared.tweet({
            tweetId: parameters.tweetId,
            viewerId: parameters.viewerId
        });

        if (viewableTweet === null) {
            return null;
        }

        const viewables: BookmarkViewables = {
            tweet: viewableTweet as ViewableTweet
        };

        return viewables;
    }
}