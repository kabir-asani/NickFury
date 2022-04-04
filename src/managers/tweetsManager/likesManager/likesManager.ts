import { assert } from "console";
import { DatabaseAssistant } from "../../../assistants/database/database";
import { StreamAssistant } from "../../../assistants/stream/stream";
import { Empty, Failure, Success } from "../../../utils/typescriptx/typescriptx";
import { TxCollections } from "../../core/collections";
import { Paginated, PaginationQuery } from "../../core/types";
import { UsersManager } from "../../usersManager/usersManager";
import { Tweet } from "../models";
import { TweetsManager } from "../tweetsManager";
import { Like } from "./models";
import { CreateLikeFailure, DeleteLikeFailure, LikeFailure, LikesFeedFailure } from "./types";

export class LikesManager {
    public static readonly shared = new LikesManager();

    async exists(parameters: {
        likeId?: String;
    } &
    {
        like?: {
            authorId: String;
            tweetId: String;
        }
    }): Promise<boolean> {
        assert(
            parameters.like !== undefined || parameters.likeId !== undefined,
            "Either of like or likeId should be present"
        );

        const likesCollectionRef = DatabaseAssistant.shared.collectionGroup(TxCollections.likes);

        if (parameters.likeId !== undefined) {
            const likesQuery = likesCollectionRef.where(
                "id",
                "==",
                parameters.likeId.valueOf(),
            ).limit(1);


            try {
                const snapshot = await likesQuery.get();

                if (snapshot.empty) {
                    return false;
                }

                return true;
            } catch {
                return false;
            }
        }

        if (parameters.like !== undefined) {
            const likesQuery = likesCollectionRef.where(
                "tweetId",
                "==",
                parameters.like.tweetId.valueOf(),
            ).where(
                "authorId",
                "==",
                parameters.like.authorId.valueOf(),
            ).limit(1);

            try {
                const snapshot = await likesQuery.get();

                if (snapshot.empty) {
                    return false
                }

                return true;
            } catch {
                return false;
            }
        }

        return false;
    }

    async createLike(parameters: {
        tweetId: String;
        authorId: String;
    }): Promise<Success<Like> | Failure<CreateLikeFailure>> {
        const isTweetExists = await TweetsManager.shared.exits({
            tweetId: parameters.tweetId.valueOf(),
        });

        if (!isTweetExists) {
            const result = new Failure<CreateLikeFailure>(CreateLikeFailure.TWEET_DOES_NOT_EXISTS);
            return result;
        }

        const isAuthorExists = await UsersManager.shared.exists({
            userId: parameters.authorId
        });

        if (!isAuthorExists) {
            const result = new Failure<CreateLikeFailure>(CreateLikeFailure.AUTHOR_DOES_NOT_EXISTS);
            return result;
        }

        const isLikeExists = await this.exists({
            like: {
                tweetId: parameters.tweetId,
                authorId: parameters.authorId,
            }
        });

        if (isLikeExists) {
            const result = new Failure<CreateLikeFailure>(CreateLikeFailure.LIKE_ALREADY_EXISTS);
            return result;
        }

        const addLikeResult = await StreamAssistant.shared.likeReactions.addLike({
            tweetId: parameters.tweetId,
        });

        if (addLikeResult instanceof Failure) {
            const result = new Failure<CreateLikeFailure>(CreateLikeFailure.UNKNOWN);
            return result;
        }

        const like: Like = {
            id: addLikeResult.data.id,
            tweetId: parameters.tweetId,
            authorId: parameters.authorId,
        };

        try {
            // References
            const tweetsCollectionRef = DatabaseAssistant.shared.collection(TxCollections.tweets);
            const tweetDocumentRef = tweetsCollectionRef.doc(like.tweetId.valueOf());

            const likesCollectionRef = tweetDocumentRef.collection(TxCollections.likes);
            const likeDocumentRef = likesCollectionRef.doc(like.id.valueOf());

            await DatabaseAssistant.shared.runTransaction(async (transaction) => {
                const tweetDocument = await tweetDocumentRef.get();
                const tweet = tweetDocument.data() as unknown as Tweet;

                const updatedTweet: Tweet = {
                    ...tweet,
                    meta: {
                        likesCount: tweet.meta.likesCount.valueOf() + 1
                    }
                };

                transaction.create(
                    likeDocumentRef,
                    like
                );

                transaction.update(
                    tweetDocumentRef,
                    updatedTweet,
                );

                return Promise.resolve();
            });

            const result = new Success<Like>(like);
            return result;
        } catch {
            const result = new Failure<CreateLikeFailure>(CreateLikeFailure.UNKNOWN);
            return result;
        }
    }

    async like(parameters: {
        likeId: String;
    }): Promise<Success<Like> | Failure<LikeFailure>> {
        const likesCollectionRef = DatabaseAssistant.shared.collectionGroup(TxCollections.likes);

        const likesQuery = likesCollectionRef.where(
            "id",
            "==",
            parameters.likeId.valueOf(),
        ).limit(1);

        try {
            const snapshot = await likesQuery.get();

            if (snapshot.empty) {
                const result = new Failure<LikeFailure>(LikeFailure.LIKE_DOES_NOT_EXISTS);
                return result;
            }

            const like = snapshot.docs[0].data() as unknown as Like;

            const result = new Success<Like>(like);
            return result;
        } catch {
            const result = new Failure<LikeFailure>(LikeFailure.UNKNOWN);
            return result;
        }
    }

    async likesList(parameters: {
        tweetId: String;
    } & PaginationQuery): Promise<Success<Paginated<Like>> | Failure<LikesFeedFailure>> {
        const isTweetExists = await TweetsManager.shared.exits({
            tweetId: parameters.tweetId,
        });

        if (!isTweetExists) {
            const result = new Failure<LikesFeedFailure>(LikesFeedFailure.TWEET_DOES_NOT_EXISTS);
            return result;
        }

        const feedResult = await StreamAssistant.shared.likeReactions.likesList({
            tweetId: parameters.tweetId,
            nextToken: parameters.nextToken,
            limit: parameters.limit,
        });

        if (feedResult instanceof Failure) {
            const result = new Failure<LikesFeedFailure>(LikesFeedFailure.UNKNOWN);
            return result;
        }

        const partialLikes = feedResult.data.page;

        const likes: Like[] = [];

        for (const partialLike of partialLikes) {
            const likeResult = await this.like({
                likeId: partialLike.id
            });

            if (likeResult instanceof Failure) {
                const result = new Failure<LikesFeedFailure>(LikesFeedFailure.UNKNOWN);
                return result;
            }

            const like = likeResult.data;
            likes.push(like);
        }

        const paginatedLikes = new Paginated<Like>({
            page: likes,
            nextToken: feedResult.data.nextToken,
        });

        const result = new Success<Paginated<Like>>(paginatedLikes);
        return result;
    }

    async deleteLike(parameters: {
        likeId: String;
    }): Promise<Success<Empty> | Failure<DeleteLikeFailure>> {
        const likesCollectionRef = DatabaseAssistant.shared.collectionGroup(TxCollections.likes);

        const likesQuery = likesCollectionRef.where(
            "id",
            "==",
            parameters.likeId.valueOf(),
        ).limit(1);

        try {
            const snapshot = await likesQuery.get();

            if (snapshot.empty) {
                const result = new Failure<DeleteLikeFailure>(DeleteLikeFailure.LIKE_DOES_NOT_EXISTS);
                return result;
            }

            const likeDocumentRef = snapshot.docs[0].ref;
            const like = snapshot.docs[0].data() as unknown as Like;

            const removeLikeResult = await StreamAssistant.shared.likeReactions.removeLike({
                likeId: like.id
            });

            if (removeLikeResult instanceof Failure) {
                const result = new Failure<DeleteLikeFailure>(DeleteLikeFailure.UNKNOWN);
                return result;
            }

            const tweetsCollectionRef = DatabaseAssistant.shared.collection(TxCollections.tweets);
            const tweetDocumentRef = tweetsCollectionRef.doc(like.tweetId.valueOf());

            await DatabaseAssistant.shared.runTransaction(async (transaction) => {
                const tweetDocument = await tweetDocumentRef.get();
                const tweet = tweetDocument.data() as unknown as Tweet;

                const updatedTweet: Tweet = {
                    ...tweet,
                    meta: {
                        likesCount: tweet.meta.likesCount.valueOf() + 1
                    }
                };

                transaction.delete(
                    likeDocumentRef,
                );

                transaction.update(
                    tweetDocumentRef,
                    updatedTweet,
                );

                return Promise.resolve();
            });

            const result = new Success<Empty>({});
            return result;
        } catch {
            const result = new Failure<DeleteLikeFailure>(DeleteLikeFailure.UNKNOWN);
            return result;
        }
    }

}