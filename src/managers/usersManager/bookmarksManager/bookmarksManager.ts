import { assert } from "console";
import { DatabaseAssistant } from "../../../assistants/database/database";
import { StreamAssistant } from "../../../assistants/stream/stream";
import { Empty, Failure, Success } from "../../../utils/typescriptx/typescriptx";
import { TxDatabaseCollections } from "../../core/collections";
import { Paginated } from "../../core/types";
import { Bookmark } from "./models";
import { CreateBookmarkFailure, DeleteBookmarkFailure } from "./types";

export class BookmarksManager {
    public static readonly shared = new BookmarksManager();

    async exists(parameters: {
        authorId: String;
        tweetId?: String;
        bookmarkId?: String;
    }): Promise<Boolean> {
        assert(
            parameters.bookmarkId !== undefined || parameters.tweetId !== undefined,
            "One of bookmarkId or tweetId should be present"
        );

        if (parameters.bookmarkId !== undefined) {
            const collectionRef = DatabaseAssistant.shared.collection(
                TxDatabaseCollections.users +
                "/" +
                parameters.authorId.valueOf() +
                "/" +
                TxDatabaseCollections.bookmarks
            );
            const documentRef = collectionRef.doc(parameters.bookmarkId.valueOf());
            const document = await documentRef.get();

            if (document.exists) {
                return true;
            } else {
                return false;
            }
        }

        if (parameters.tweetId !== undefined) {
            const collectionRef = DatabaseAssistant.shared.collection(
                TxDatabaseCollections.users +
                "/" +
                parameters.authorId.valueOf() +
                "/" +
                TxDatabaseCollections.bookmarks
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
    }

    async createBookmark(parameters: {
        authorId: String;
        tweetId: String;
    }): Promise<Success<Bookmark> | Failure<CreateBookmarkFailure>> {
        const isBookmarkExists = await this.exists({
            authorId: parameters.authorId,
            tweetId: parameters.tweetId
        });

        if (isBookmarkExists) {
            const result = new Failure<CreateBookmarkFailure>(CreateBookmarkFailure.ALREADY_EXISTS);
            return result;
        }

        const bookmarkResult = StreamAssistant.shared.bookmarkFeed.createBookmarkActivity({
            authorId: parameters.authorId,
            tweetId: parameters.tweetId
        });

        if (bookmarkResult instanceof Success) {
            const collectionRef = DatabaseAssistant.shared.collection(
                TxDatabaseCollections.users +
                "/" +
                parameters.authorId.valueOf() +
                "/" +
                TxDatabaseCollections.bookmarks
            );
            const documentRef = collectionRef.doc(bookmarkResult.data.id);

            const bookmark: Bookmark = {
                id: bookmarkResult.data.id,
                tweetId: parameters.tweetId,
                authorId: parameters.authorId,
            };

            try {
                await documentRef.create(bookmark);

                const result = new Success<Bookmark>(bookmark);
                return result;
            } catch {
                const result = new Failure<CreateBookmarkFailure>(CreateBookmarkFailure.ALREADY_EXISTS);
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
    }): Promise<Bookmark | null> {
        assert(
            parameters.bookmarkId !== undefined || parameters.tweetId !== undefined,
            "One of bookmarkId or tweetId should be present"
        );

        if (parameters.bookmarkId !== undefined) {
            const collectionRef = DatabaseAssistant.shared.collection(
                TxDatabaseCollections.users +
                "/" +
                parameters.authorId.valueOf() +
                "/" +
                TxDatabaseCollections.bookmarks
            );
            const documentRef = collectionRef.doc(parameters.bookmarkId.valueOf());
            const document = await documentRef.get();

            if (document.exists) {
                const bookmark = document.data() as unknown as Bookmark;

                const result = bookmark;
                return result;
            }
        }

        if (parameters.tweetId !== undefined) {
            const collectionRef = DatabaseAssistant.shared.collection(
                TxDatabaseCollections.users +
                "/" +
                parameters.authorId.valueOf() +
                "/" +
                TxDatabaseCollections.bookmarks
            );
            const query = collectionRef.where(
                "tweetId",
                "==",
                parameters.tweetId.valueOf(),
            );

            const querySnapshot = await query.get();

            if (!querySnapshot.empty) {
                const queryDocument = querySnapshot.docs[0];
                const bookmark = queryDocument.data() as unknown as Bookmark;

                const result = bookmark;
                return result;
            }
        }

        const result = null;
        return result;
    }


    // Update to respond with success and failure instead
    async bookmarks(parameters: {
        authorId: String;
        limit?: Number;
        nextToken?: String;
    }): Promise<Paginated<Bookmark> | null> {
        const paginated = await StreamAssistant.shared.bookmarkFeed.bookmarks({
            authorId: parameters.authorId,
            limit: parameters.limit,
            nextToken: parameters.nextToken,
        });

        if (paginated !== null) {
            const bookmarks: Bookmark[] = [];

            for (const partialBookmark of paginated.page) {
                const bookmark = this.bookmark({
                    authorId: partialBookmark.authorId,
                    bookmarkId: partialBookmark.bookmarkId,
                });
            }

            const result = new Paginated<Bookmark>({
                page: bookmarks,
                nextToken: paginated.nextToken,
            });
            return result;
        }

        const result = null;
        return result;
    }

    async deleteBookmark(parameters: {
        authorId: String;
        bookmarkId: String;
    }): Promise<Success<Bookmark> | Failure<DeleteBookmarkFailure>> {
        const usersCollectionRef = DatabaseAssistant.shared.collection(TxDatabaseCollections.users);
        const userDocumentRef = usersCollectionRef.doc(parameters.authorId.valueOf());

        const bookmarksCollectionRef = userDocumentRef.collection(TxDatabaseCollections.bookmarks);
        const bookmarkDocumentRef = bookmarksCollectionRef.doc(parameters.bookmarkId.valueOf());

        try {
            const bookmarkDocument = await bookmarkDocumentRef.get();
            const bookmark = bookmarkDocument.data() as unknown as Bookmark;

            await bookmarkDocumentRef.delete();

            const result = new Success<Bookmark>(bookmark);
            return result;
        } catch {
            const result = new Failure<DeleteBookmarkFailure>(DeleteBookmarkFailure.DOES_NOT_EXISTS);
            return result;
        }
    }
}