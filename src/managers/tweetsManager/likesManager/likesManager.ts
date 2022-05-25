import { assert } from "console";
import { DatabaseAssistant, DatabaseCollections } from "../../../assistants/database/database";
import { Empty, Failure, Success } from "../../../utils/typescriptx/typescriptx";
import { Like, ViewableLike, Tweet, LikeViewables, ViewableUser } from "../../core/models";
import { Paginated, PaginationParameters, ViewablesParameters } from "../../core/types";
import { LikeCreationFailureReason, LikeDeletionFailureReason } from "./types";
import { Dately } from "../../../utils/dately/dately";
import { StreamAssistant } from "../../../assistants/stream/stream";
import { UsersManager } from "../../usersManager/usersManager";

export class LikesManager {
    static readonly shared = new LikesManager();

    private constructor() { }

    async exists(parameters: {
        likeId?: String;
        likeDetails?: {
            tweetId: String;
            authorId: String;
        }
    }): Promise<Boolean> {
        assert(
            parameters.likeId !== undefined || parameters.likeDetails !== undefined,
            "At least one of likeId or likeDetails should be present"
        );

        const likesCollection = DatabaseAssistant.shared.collectionGroup(DatabaseCollections.likes);

        let likesQuery = likesCollection
            .limit(1);

        if (parameters.likeId !== undefined) {
            likesQuery = likesQuery
                .where(
                    "id",
                    "==",
                    parameters.likeId.valueOf()
                );
        } else if (parameters.likeDetails !== undefined) {
            likesQuery = likesQuery
                .where(
                    "tweetId",
                    "==",
                    parameters.likeDetails.tweetId.valueOf()
                )
                .where(
                    "authorId",
                    "==",
                    parameters.likeDetails.authorId
                );
        }


        try {
            const likesQuerySnapshot = await likesQuery.get();

            if (likesQuerySnapshot.docs.length > 0) {
                return true;
            } else {
                return false;
            }
        } catch {
            return false;
        }
    }

    async create(parameters: {
        tweetId: String;
        authorId: String;
    }): Promise<Success<Like> | Failure<LikeCreationFailureReason>> {
        const isLikeExists = await this.exists({
            likeDetails: {
                tweetId: parameters.tweetId,
                authorId: parameters.authorId
            }
        });

        if (isLikeExists) {
            const reply = new Failure<LikeCreationFailureReason>(
                LikeCreationFailureReason.likeAlreadyExists
            );

            return reply;
        }

        const likeAddition = await StreamAssistant.shared.likeReactions.addLike({
            tweetId: parameters.tweetId
        });

        if (likeAddition instanceof Failure) {
            const reply = new Failure<LikeCreationFailureReason>(
                LikeCreationFailureReason.unknown
            );

            return reply;
        }

        try {
            const like = await DatabaseAssistant.shared.runTransaction(async (transaction) => {
                const tweetsCollection = DatabaseAssistant.shared.collection(DatabaseCollections.tweets);
                const tweetDocumentRef = tweetsCollection.doc(parameters.tweetId.valueOf());
                const tweetDocument = await transaction.get(tweetDocumentRef);

                const tweet = tweetDocument.data() as unknown as Tweet;
                const like: Like = {
                    id: likeAddition.data.id,
                    authorId: parameters.authorId,
                    tweetId: parameters.tweetId,
                    creationDate: Dately.shared.now()
                };

                const likesCollection = DatabaseAssistant.shared.collection(DatabaseCollections.likes);
                const likeDocumentRef = likesCollection.doc(like.id.valueOf());

                transaction.create(
                    likeDocumentRef,
                    like
                );
                transaction.update(
                    tweetDocumentRef,
                    {
                        "interactionDetails.likesCount": tweet.interactionDetails.likesCount.valueOf() + 1
                    }
                );

                return like;
            });

            const reply = new Success<Like>(like);

            return reply;
        } catch {
            const reply = new Failure<LikeCreationFailureReason>(
                LikeCreationFailureReason.unknown
            );

            return reply;
        }
    }

    async delete(parameters: {
        likeId: String;
    }): Promise<Success<Empty> | Failure<LikeDeletionFailureReason>> {
        const isLikeExists = await this.exists({
            likeId: parameters.likeId
        });

        if (!isLikeExists) {
            const reply = new Failure<LikeDeletionFailureReason>(
                LikeDeletionFailureReason.likeDoesNotExists
            );

            return reply;
        }

        const likeDeletion = await StreamAssistant.shared.likeReactions.removeLike({
            likeId: parameters.likeId
        });

        if (likeDeletion instanceof Failure) {
            const reply = new Failure<LikeDeletionFailureReason>(
                LikeDeletionFailureReason.unknown
            );

            return reply;
        }

        try {
            await DatabaseAssistant.shared.runTransaction(async (transaction) => {
                const likesCollection = DatabaseAssistant.shared.collection(DatabaseCollections.likes);
                const likeDocumentRef = likesCollection.doc(parameters.likeId.valueOf());

                const likeDocument = await transaction.get(likeDocumentRef);

                const like = likeDocument.data() as unknown as Like;

                const tweetsCollection = DatabaseAssistant.shared.collection(DatabaseCollections.tweets);
                const tweetDocumentRef = tweetsCollection.doc(like.tweetId.valueOf());
                const tweetDocument = await transaction.get(tweetDocumentRef);

                const tweet = tweetDocument.data() as unknown as Tweet;

                transaction.delete(likeDocumentRef);
                transaction.update(
                    tweetDocumentRef,
                    {
                        "interactionDetails.likesCount": Math.max(
                            tweet.interactionDetails.likesCount.valueOf() - 1,
                            0
                        )
                    }
                );
            });

            const reply = new Success<Empty>({});

            return reply;
        } catch {
            const reply = new Failure<LikeDeletionFailureReason>(
                LikeDeletionFailureReason.unknown
            );

            return reply;
        }
    }

    async like(parameters: {
        likeId: String;
    } & ViewablesParameters): Promise<Like | ViewableLike | null> {
        const likesCollection = DatabaseAssistant.shared.collection(DatabaseCollections.likes);
        const likeDocumentRef = likesCollection.doc(parameters.likeId.valueOf());

        try {
            const likeDocument = await likeDocumentRef.get();

            if (likeDocument.exists) {
                const like = likeDocument.data() as unknown as Like;

                if (parameters.viewerId !== undefined) {
                    const viewables = await this.viewables({
                        authorId: like.authorId,
                        viewerId: parameters.viewerId
                    });

                    if (viewables !== null) {
                        const viewableLike: ViewableLike = {
                            ...like,
                            viewables: viewables
                        };

                        return viewableLike;
                    } else {
                        return null;
                    }
                } else {
                    return like;
                }
            } else {
                return null;
            }
        } catch {
            return null;
        }
    }

    async likes(parameters: {
        tweetId: String;
    } & PaginationParameters & ViewablesParameters
    ): Promise<Paginated<Like | ViewableLike> | null> {
        const likeReactions = await StreamAssistant.shared.likeReactions.likes({
            tweetId: parameters.tweetId,
            limit: parameters.limit,
            nextToken: parameters.nextToken
        });

        if (likeReactions === null) {
            return null;
        }

        const likes = [];

        for (let likeReaction of likeReactions.page) {
            const tweet = await this.like({
                likeId: likeReaction.id,
                viewerId: parameters.viewerId
            });

            if (tweet !== null) {
                likes.push(tweet);
            } else {
                return null;
            }
        }

        if (parameters.viewerId !== undefined) {
            const reply: Paginated<ViewableLike> = {
                page: likes as unknown as ViewableLike[],
                nextToken: likeReactions.nextToken
            }

            return reply;
        } else {
            const reply: Paginated<Like> = {
                page: likes as unknown as Like[],
                nextToken: likeReactions.nextToken
            }

            return reply;
        }
    }

    private async viewables(parameters: {
        authorId: String;
        viewerId: String;
    }): Promise<LikeViewables | null> {
        const viewableAuthor = await UsersManager.shared.user({
            id: parameters.authorId,
            viewerId: parameters.viewerId
        });

        if (viewableAuthor == null) {
            return null;
        }

        const viewables: LikeViewables = {
            author: viewableAuthor as ViewableUser
        }

        return viewables;
    }
}