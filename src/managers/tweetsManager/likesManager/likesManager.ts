import { assert } from "console";
import { DatabaseAssistant, DatabaseCollections } from "../../../assistants/database/database";
import { Empty, Failure, Success } from "../../../utils/typescriptx/typescriptx";
import { Like, ViewableLike, Tweet } from "../../core/models";
import { Paginated, PaginationParameters, ViewablesParameters } from "../../core/types";
import { LikeCreationFailureReason, LikeDeletionFailureReason } from "./types";
import { Dately } from "../../../utils/dately/dately";
import { StreamAssistant } from "../../../assistants/stream/stream";

export class LikesManager {
    static readonly shared = new LikesManager();

    private constructor() { }

    async exists(parameters: {
        likeId?: String;
        likeDetails: {
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

                const likesCollection = DatabaseAssistant.shared.collection(
                    DatabaseCollections.tweets
                    + "/" + parameters.tweetId.valueOf() + "/" +
                    DatabaseCollections.likes
                );
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
        // TODO: Implement `LikesManager.delete`
        const reply = new Failure<LikeDeletionFailureReason>(
            LikeDeletionFailureReason.unknown
        );

        return reply;
    }

    async likes(parameters: {
        tweetId: String;
    } & PaginationParameters & ViewablesParameters
    ): Promise<Paginated<Like | ViewableLike> | null> {
        // TODO: Implement `LikesManager.likes`
        return null;
    }
}