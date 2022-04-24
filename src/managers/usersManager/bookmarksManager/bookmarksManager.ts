import { assert } from "console";
import { DatabaseAssistant } from "../../../assistants/database/database";
import { StreamAssistant } from "../../../assistants/stream/stream";
import { Empty, Failure, Success } from "../../../utils/typescriptx/typescriptx";
import { TxDatabaseCollections } from "../../core/collections";
import { Paginated, PaginationQuery } from "../../core/types";
import { TweetsManager } from "../../tweetsManager/tweetsManager";
import { UsersManager } from "../usersManager";
import { Bookmark } from "./models";
import { BookmarkFailure, BookmarksFeedFailure, CreateBookmarkFailure, DeleteBookmarkFailure } from "./types";

export class BookmarksManager {
    public static readonly shared = new BookmarksManager();

    private constructor() { }

    async exists(parameters: {
        bookmark?: {
            tweetId: String;
            authorId: String;
        },
        bookmarkId?: String;
    }): Promise<Boolean> {
        assert(
            parameters.bookmarkId !== undefined || parameters.bookmark !== undefined,
            "One of bookmarkId or bookmark should be present"
        );

        const bookmarksCollectionRef = DatabaseAssistant.shared.collectionGroup(TxDatabaseCollections.bookmarks);

        if (parameters.bookmarkId !== undefined) {
            const bookmarksQuery = bookmarksCollectionRef.where(
                "id",
                "==",
                parameters.bookmarkId.valueOf(),
            ).limit(1);

            try {
                const snapshot = await bookmarksQuery.get();

                if (snapshot.empty) {
                    return false;
                }

                return true;
            } catch {
                return false;
            }
        }

        if (parameters.bookmark !== undefined) {
            const bookmarksQuery = bookmarksCollectionRef.where(
                "tweetId",
                "==",
                parameters.bookmark.tweetId.valueOf(),
            ).where(
                "authorId",
                "==",
                parameters.bookmark.authorId.valueOf(),
            ).limit(1);

            try {
                const snapshot = await bookmarksQuery.get();

                if (snapshot.empty) {
                    return false;
                }

                return true;
            } catch {
                return false;
            }
        }

        return false;
    }

    async createBookmark(parameters: {
        tweetId: String;
        authorId: String;
    }): Promise<Success<Bookmark> | Failure<CreateBookmarkFailure>> {
        const isAuthorExists = await UsersManager.shared.exists({
            userId: parameters.authorId
        });

        if (!isAuthorExists) {
            const result = new Failure<CreateBookmarkFailure>(CreateBookmarkFailure.AUTHOR_DOES_NOT_EXISTS);
            return result;
        }

        const isTweetExists = await TweetsManager.shared.exits({
            tweetId: parameters.tweetId
        });

        if (!isTweetExists) {
            const result = new Failure<CreateBookmarkFailure>(CreateBookmarkFailure.TWEET_DOES_NOT_EXISTS);
            return result;
        }

        const isBookmarkExists = await this.exists({
            bookmark: {
                authorId: parameters.authorId,
                tweetId: parameters.tweetId
            }
        });

        if (isBookmarkExists) {
            const result = new Failure<CreateBookmarkFailure>(CreateBookmarkFailure.BOOKMARK_ALREADY_EXISTS);
            return result;
        }

        const bookmarkResult = StreamAssistant.shared.bookmarkFeed.createBookmarkActivity({
            authorId: parameters.authorId,
            tweetId: parameters.tweetId
        });

        if (bookmarkResult instanceof Success) {
            const bookmarksCollectionRef = DatabaseAssistant.shared.collection(
                TxDatabaseCollections.users +
                "/" +
                parameters.authorId.valueOf() +
                "/" +
                TxDatabaseCollections.bookmarks
            );
            const bookmarkDocumentRef = bookmarksCollectionRef.doc(bookmarkResult.data.id);

            const bookmark: Bookmark = {
                id: bookmarkResult.data.id,
                authorId: parameters.authorId,
                tweetId: parameters.tweetId,
            };

            try {
                await bookmarkDocumentRef.create(bookmark);

                const result = new Success<Bookmark>(bookmark);
                return result;
            } catch {
                const result = new Failure<CreateBookmarkFailure>(CreateBookmarkFailure.BOOKMARK_ALREADY_EXISTS);
                return result;
            }
        }

        const result = new Failure<CreateBookmarkFailure>(CreateBookmarkFailure.UNKNOWN);
        return result;
    }

    async bookmark(parameters: {
        bookmarkId: String;
    }): Promise<Success<Bookmark> | Failure<BookmarkFailure>> {
        const bookmarksCollectionRef = DatabaseAssistant.shared.collectionGroup(TxDatabaseCollections.bookmarks);

        const bookmarksQuery = bookmarksCollectionRef.where(
            "id",
            "==",
            parameters.bookmarkId.valueOf()
        ).limit(1);

        try {
            const snapshot = await bookmarksQuery.get();

            if (snapshot.empty) {
                const result = new Failure<BookmarkFailure>(BookmarkFailure.BOOKMARK_DOES_NOT_EXISTS);
                return result;
            }

            const bookmark = snapshot.docs[0].data() as unknown as Bookmark;

            const result = new Success<Bookmark>(bookmark);
            return result;
        } catch {
            const result = new Failure<BookmarkFailure>(BookmarkFailure.BOOKMARK_DOES_NOT_EXISTS);
            return result;
        }
    }


    // Update to respond with success and failure instead
    async bookmarksFeed(parameters: {
        authorId: String;
    } & PaginationQuery): Promise<Success<Paginated<Bookmark>> | Failure<BookmarksFeedFailure>> {
        const isAuthorExists = await UsersManager.shared.exists({
            userId: parameters.authorId
        });

        if (!isAuthorExists) {
            const result = new Failure<BookmarksFeedFailure>(BookmarksFeedFailure.AUTHOR_DOES_NOT_EXISTS);
            return result;
        }

        const bookmarkActivitiesResult = await StreamAssistant.shared.bookmarkFeed.activities({
            authorId: parameters.authorId,
            limit: parameters.limit,
            nextToken: parameters.nextToken,
        });

        if (bookmarkActivitiesResult instanceof Failure) {
            const result = new Failure<BookmarksFeedFailure>(BookmarksFeedFailure.UNKNOWN);
            return result;
        }

        if (bookmarkActivitiesResult !== null) {
            const bookmarks: Bookmark[] = [];

            for (const partialBookmark of bookmarkActivitiesResult.page) {
                const bookmarkResult = await this.bookmark({
                    bookmarkId: partialBookmark.bookmarkId,
                });

                if (bookmarkResult instanceof Failure) {
                    const result = new Failure<BookmarksFeedFailure>(BookmarksFeedFailure.UNKNOWN);
                    return result;
                }

                const bookmark = bookmarkResult.data;

                bookmarks.push(bookmark);
            }

            const feed = new Paginated<Bookmark>({
                page: bookmarks,
                nextToken: bookmarkActivitiesResult.nextToken,
            });

            const result = new Success<Paginated<Bookmark>>(feed);
            return result;
        }

        const result = new Failure<BookmarksFeedFailure>(BookmarksFeedFailure.UNKNOWN);
        return result;
    }

    async deleteBookmark(parameters: {
        bookmarkId: String;
    }): Promise<Success<Empty> | Failure<DeleteBookmarkFailure>> {
        const bookmarksCollectionRef = DatabaseAssistant.shared.collectionGroup(TxDatabaseCollections.bookmarks);

        const bookmarksQuery = bookmarksCollectionRef.where(
            "id",
            "==",
            parameters.bookmarkId.valueOf(),
        ).limit(1);

        try {
            const snapshot = await bookmarksQuery.get();

            if (snapshot.empty) {
                const result = new Failure<DeleteBookmarkFailure>(DeleteBookmarkFailure.BOOKMARK_DOES_NOT_EXISTS);
                return result;
            }

            const bookmark = snapshot.docs[0].data() as unknown as Bookmark;

            const deleteBookmarkActivityResult = await StreamAssistant.shared.bookmarkFeed.removeBookmarkActivity({
                authorId: bookmark.authorId,
                bookmarkId: bookmark.id
            });

            if (deleteBookmarkActivityResult instanceof Failure) {
                const result = new Failure<DeleteBookmarkFailure>(DeleteBookmarkFailure.UNKNOWN);
                return result;
            }

            // NOTE: Not deleting bookmark object from backend as it might be useful later on

            const result = new Success<Empty>({});
            return result;
        } catch {
            const result = new Failure<DeleteBookmarkFailure>(DeleteBookmarkFailure.UNKNOWN);
            return result;
        }
    }
}