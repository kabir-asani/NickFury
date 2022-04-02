import { assert } from "console";
import { DatabaseAssistant } from "../../../assistants/database/database";
import { StreamAssistant } from "../../../assistants/stream/stream";
import { Empty, Failure, Success } from "../../../utils/typescriptx/typescriptx";
import { DatabaseCollections } from "../../core/collections";
import { Paginated, PaginationQuery } from "../../core/types";
import { TweetsManager } from "../tweetsManager/tweetsManager";
import { UsersManager } from "../usersManager";
import { Bookmark } from "./models";
import { BookmarkFailure, BookmarksFeedFailure, CreateBookmarkFailure, DeleteBookmarkFailure } from "./types";

export class BookmarksManager {
    public static readonly shared = new BookmarksManager();

    async exists(parameters: {
        authorId?: String;
        tweetId?: String;
        bookmarkId?: String;
    }): Promise<Boolean> {
        assert(
            parameters.bookmarkId !== undefined || (parameters.tweetId !== undefined && parameters.authorId !== undefined),
            "One of bookmarkId or tweetId should be present"
        );

        try {
            if (parameters.bookmarkId !== undefined) {
                const collectionRef = DatabaseAssistant.shared.collectionGroup(DatabaseCollections.bookmarks);

                const query = collectionRef.where(
                    "id",
                    "==",
                    parameters.bookmarkId,
                ).limit(1);

                const querySnapshot = await query.get();

                if (querySnapshot.empty) {
                    return false;
                } else {
                    return true;
                }
            }

            if (parameters.tweetId !== undefined && parameters.authorId) {
                const collectionRef = DatabaseAssistant.shared.collection(
                    DatabaseCollections.users +
                    "/" +
                    parameters.authorId.valueOf() +
                    "/" +
                    DatabaseCollections.bookmarks
                );

                const query = collectionRef.where(
                    "tweetId",
                    "==",
                    parameters.tweetId.valueOf(),
                );

                const querySnapshot = await query.get();

                if (querySnapshot.empty) {
                    return false;
                } else {
                    return true;
                }
            }

            return false;
        } catch {
            return false;
        }
    }

    async createBookmark(parameters: {
        tweetId: String;
        authorId: String;
    }): Promise<Success<Bookmark> | Failure<CreateBookmarkFailure>> {
        const isBookmarkExists = await this.exists({
            authorId: parameters.authorId,
            tweetId: parameters.tweetId
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
            const collectionRef = DatabaseAssistant.shared.collection(
                DatabaseCollections.users +
                "/" +
                parameters.authorId.valueOf() +
                "/" +
                DatabaseCollections.bookmarks
            );
            const documentRef = collectionRef.doc(bookmarkResult.data.id);

            const bookmark: Bookmark = {
                id: bookmarkResult.data.id,
                authorId: parameters.authorId,
                tweetId: parameters.tweetId,
            };

            try {
                await documentRef.create(bookmark);

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
        authorId: String;
        bookmarkId?: String;
        tweetId?: String;
    }): Promise<Success<Bookmark> | Failure<BookmarkFailure>> {
        assert(
            parameters.bookmarkId !== undefined || parameters.tweetId !== undefined,
            "One of bookmarkId or tweetId should be present"
        );

        const isAuthorExists = await UsersManager.shared.exists({
            userId: parameters.authorId
        });

        if (!isAuthorExists) {
            const result = new Failure<BookmarkFailure>(BookmarkFailure.AUTHOR_DOES_NOT_EXISTS);
            return result;
        }


        if (parameters.bookmarkId !== undefined) {
            const collectionRef = DatabaseAssistant.shared.collection(
                DatabaseCollections.users +
                "/" +
                parameters.authorId.valueOf() +
                "/" +
                DatabaseCollections.bookmarks
            );
            const documentRef = collectionRef.doc(parameters.bookmarkId.valueOf());
            const document = await documentRef.get();

            if (document.exists) {
                const bookmark = document.data() as unknown as Bookmark;

                const result = new Success<Bookmark>(bookmark);
                return result;
            } else {
                const result = new Failure<BookmarkFailure>(BookmarkFailure.BOOKMARK_DOES_NOT_EXISTS);
                return result;
            }
        }

        if (parameters.tweetId !== undefined) {
            const isTweetExists = await TweetsManager.shared.exits({
                tweetId: parameters.tweetId
            });

            if (!isTweetExists) {
                const result = new Failure<BookmarkFailure>(BookmarkFailure.TWEET_DOES_NOT_EXISTS);
                return result;
            }


            const collectionRef = DatabaseAssistant.shared.collection(
                DatabaseCollections.users +
                "/" +
                parameters.authorId.valueOf() +
                "/" +
                DatabaseCollections.bookmarks
            );
            const query = collectionRef.where(
                "tweetId",
                "==",
                parameters.tweetId.valueOf(),
            );

            const querySnapshot = await query.get();

            if (querySnapshot.empty) {
                const result = new Failure<BookmarkFailure>(BookmarkFailure.BOOKMARK_DOES_NOT_EXISTS);
                return result;
            } else {
                const queryDocument = querySnapshot.docs[0];
                const bookmark = queryDocument.data() as unknown as Bookmark;

                const result = new Success<Bookmark>(bookmark);
                return result;
            }
        }

        const result = new Failure<BookmarkFailure>(BookmarkFailure.UNKNOWN);
        return result;
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

        const activities = await StreamAssistant.shared.bookmarkFeed.activities({
            authorId: parameters.authorId,
            limit: parameters.limit,
            nextToken: parameters.nextToken,
        });

        if (activities !== null) {
            const bookmarks: Bookmark[] = [];

            for (const partialBookmark of activities.page) {
                const bookmarkResult = await this.bookmark({
                    authorId: partialBookmark.authorId,
                    bookmarkId: partialBookmark.bookmarkId,
                });

                if (bookmarkResult instanceof Failure) {
                    const result = new Failure<BookmarksFeedFailure>(BookmarksFeedFailure.UNKNOWN);
                    return result;
                }

                bookmarks.push(bookmarkResult.data);
            }

            const feed = new Paginated<Bookmark>({
                page: bookmarks,
                nextToken: activities.nextToken,
            });

            const result = new Success<Paginated<Bookmark>>(feed);
            return result;
        }

        const result = new Failure<BookmarksFeedFailure>(BookmarksFeedFailure.UNKNOWN);
        return result;
    }

    async deleteBookmark(parameters: {
        authorId: String;
        bookmarkId: String;
    }): Promise<Success<Empty> | Failure<DeleteBookmarkFailure>> {
        const isAuthorExists = await UsersManager.shared.exists({
            userId: parameters.authorId
        });

        if (!isAuthorExists) {
            const result = new Failure<DeleteBookmarkFailure>(DeleteBookmarkFailure.AUTHOR_DOES_NOT_EXISTS);
            return result;
        }

        const usersCollectionRef = DatabaseAssistant.shared.collection(DatabaseCollections.users);
        const userDocumentRef = usersCollectionRef.doc(parameters.authorId.valueOf());

        const bookmarksCollectionRef = userDocumentRef.collection(DatabaseCollections.bookmarks);
        const bookmarkDocumentRef = bookmarksCollectionRef.doc(parameters.bookmarkId.valueOf());

        try {
            const bookmarkDocument = await bookmarkDocumentRef.get();

            if (bookmarkDocument.exists) {
                await bookmarkDocumentRef.delete();

                const result = new Success<Empty>({});
                return result;
            } else {
                const result = new Failure<DeleteBookmarkFailure>(DeleteBookmarkFailure.BOOKMARK_DOES_NOT_EXISTS);
                return result;
            }
        } catch {
            const result = new Failure<DeleteBookmarkFailure>(DeleteBookmarkFailure.UNKNOWN);
            return result;
        }
    }
}