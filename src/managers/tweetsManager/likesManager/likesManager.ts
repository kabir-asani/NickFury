import {
    DatabaseAssistant,
    DBCollections,
} from "../../../assistants/database/database";
import {
    Empty,
    Failure,
    Success,
} from "../../../utils/typescriptx/typescriptx";
import {
    Like,
    ViewableLike,
    Tweet,
    LikeViewables,
    ViewableUser,
} from "../../core/models";
import {
    Paginated,
    PaginationParameters,
    Value,
    ViewablesParameters,
} from "../../core/types";
import {
    LikeCreationFailureReason,
    LikeDeletionFailureReason,
    PaginatedLikesFailureReason,
    PaginatedViewableLikesFailureReason,
} from "./types";
import Dately from "../../../utils/dately/dately";
import StreamAssistant from "../../../assistants/stream/stream";
import UsersManager from "../../usersManager/usersManager";
import { PaginatedLikeReactionsFailure } from "../../../assistants/stream/reactions/likeReaction/types";
import logger, { LogLevel } from "../../../utils/logger/logger";

export default class LikesManager {
    static readonly shared = new LikesManager();

    private constructor() {}

    async exists(parameters: { likeId: String }): Promise<Boolean> {
        const likeDocumentPath = DBCollections.likes + `/${parameters.likeId}`;
        const likeDocumentRef = DatabaseAssistant.shared.doc(likeDocumentPath);

        const likeDocument = await likeDocumentRef.get();

        if (likeDocument.exists) {
            return true;
        }

        return false;
    }

    async existsByDetails(parameters: {
        tweetId: String;
        authorId: String;
    }): Promise<Boolean> {
        const likesCollection = DatabaseAssistant.shared.collection(
            DBCollections.likes
        );

        const likesQuery = likesCollection
            .where("tweetId", "==", parameters.tweetId.valueOf())
            .where("authorId", "==", parameters.authorId)
            .limit(1);

        const likesQuerySnapshot = await likesQuery.get();

        if (likesQuerySnapshot.docs.length > 0) {
            return true;
        }

        return false;
    }

    async likeStatuses(parameters: {
        authorId: String;
        tweetIds: String[];
    }): Promise<Value<Boolean>> {
        if (parameters.tweetIds.length === 0) {
            return {};
        }

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
    }): Promise<Success<Like> | Failure<LikeCreationFailureReason>> {
        const isLikeExists = await this.existsByDetails({
            tweetId: parameters.tweetId,
            authorId: parameters.authorId,
        });

        if (isLikeExists) {
            const reply = new Failure<LikeCreationFailureReason>(
                LikeCreationFailureReason.likeAlreadyExists
            );

            return reply;
        }

        const likeAddition = await StreamAssistant.shared.likeReactions.addLike(
            {
                tweetId: parameters.tweetId,
            }
        );

        if (likeAddition instanceof Failure) {
            const reply = new Failure<LikeCreationFailureReason>(
                LikeCreationFailureReason.unknown
            );

            return reply;
        }

        try {
            const like = await DatabaseAssistant.shared.runTransaction(
                async (transaction) => {
                    const tweetDocumentPath =
                        DBCollections.tweets + `/${parameters.tweetId}`;
                    const tweetDocumentRef =
                        DatabaseAssistant.shared.doc(tweetDocumentPath);

                    const tweetDocument = await transaction.get(
                        tweetDocumentRef
                    );

                    const tweet = tweetDocument.data() as unknown as Tweet;
                    const like: Like = {
                        id: likeAddition.data.id,
                        authorId: parameters.authorId,
                        tweetId: parameters.tweetId,
                        creationDate: Dately.shared.now(),
                    };

                    const likeDocumentPath = tweetDocumentPath + `/${like.id}`;
                    const likeDocumentRef =
                        DatabaseAssistant.shared.doc(likeDocumentPath);

                    transaction.create(likeDocumentRef, like);
                    transaction.update(tweetDocumentRef, {
                        "interactionDetails.likesCount":
                            tweet.interactionDetails.likesCount.valueOf() + 1,
                    });

                    return like;
                }
            );

            const reply = new Success<Like>(like);

            return reply;
        } catch (e) {
            logger(e, LogLevel.attention, [this, this.create]);

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
            likeId: parameters.likeId,
        });

        if (!isLikeExists) {
            const reply = new Failure<LikeDeletionFailureReason>(
                LikeDeletionFailureReason.likeDoesNotExists
            );

            return reply;
        }

        const likeDeletionResult =
            await StreamAssistant.shared.likeReactions.removeLike({
                likeId: parameters.likeId,
            });

        if (likeDeletionResult instanceof Failure) {
            const reply = new Failure<LikeDeletionFailureReason>(
                LikeDeletionFailureReason.unknown
            );

            return reply;
        }

        try {
            await DatabaseAssistant.shared.runTransaction(
                async (transaction) => {
                    const likesCollection = DatabaseAssistant.shared.collection(
                        DBCollections.likes
                    );
                    const likeDocumentRef = likesCollection.doc(
                        parameters.likeId.valueOf()
                    );

                    const likeDocument = await transaction.get(likeDocumentRef);

                    const like = likeDocument.data() as unknown as Like;

                    const tweetsCollection =
                        DatabaseAssistant.shared.collection(
                            DBCollections.tweets
                        );
                    const tweetDocumentRef = tweetsCollection.doc(
                        like.tweetId.valueOf()
                    );
                    const tweetDocument = await transaction.get(
                        tweetDocumentRef
                    );

                    const tweet = tweetDocument.data() as unknown as Tweet;

                    transaction.delete(likeDocumentRef);
                    transaction.update(tweetDocumentRef, {
                        "interactionDetails.likesCount": Math.max(
                            tweet.interactionDetails.likesCount.valueOf() - 1,
                            0
                        ),
                    });
                }
            );

            const reply = new Success<Empty>({});

            return reply;
        } catch (e) {
            logger(e, LogLevel.attention, [this, this.delete]);

            const reply = new Failure<LikeDeletionFailureReason>(
                LikeDeletionFailureReason.unknown
            );

            return reply;
        }
    }

    async like(parameters: { likeId: String }): Promise<Like | null> {
        const likeDocumentPath = DBCollections.likes + `/${parameters.likeId}`;
        const likeDocumentRef = DatabaseAssistant.shared.doc(likeDocumentPath);

        const likeDocument = await likeDocumentRef.get();

        if (!likeDocument.exists) {
            return null;
        }

        const like = likeDocument.data() as unknown as Like;

        return like;
    }

    async viewableLike(
        parameters: { likeId: String } & ViewablesParameters
    ): Promise<ViewableLike | null> {
        const like = await this.like({ likeId: parameters.likeId });

        if (like === null) {
            return null;
        }

        const likeViewables = await this.likeViewables({
            authorId: like.authorId,
            viewerId: parameters.viewerId,
        });

        if (likeViewables === null) {
            return null;
        }

        const viewableLike: ViewableLike = {
            ...like,
            viewables: likeViewables,
        };

        return viewableLike;
    }

    private async likeViewables(parameters: {
        authorId: String;
        viewerId: String;
    }): Promise<LikeViewables | null> {
        const viewableAuthor = await UsersManager.shared.viewableUser({
            id: parameters.authorId,
            viewerId: parameters.viewerId,
        });

        if (viewableAuthor == null) {
            return null;
        }

        const viewables: LikeViewables = {
            author: viewableAuthor as ViewableUser,
        };

        return viewables;
    }

    async likes(
        parameters: {
            tweetId: String;
        } & PaginationParameters
    ): Promise<
        Success<Paginated<Like>> | Failure<PaginatedLikesFailureReason>
    > {
        const likeReactionsResult =
            await StreamAssistant.shared.likeReactions.likes({
                tweetId: parameters.tweetId,
                limit: parameters.limit,
                nextToken: parameters.nextToken,
            });

        if (likeReactionsResult instanceof Failure) {
            switch (likeReactionsResult.reason) {
                case PaginatedLikeReactionsFailure.malformedParameters: {
                    const reply = new Failure<PaginatedLikesFailureReason>(
                        PaginatedLikesFailureReason.malformedParameters
                    );

                    return reply;
                }
                default: {
                    const reply = new Failure<PaginatedLikesFailureReason>(
                        PaginatedLikesFailureReason.unknown
                    );

                    return reply;
                }
            }
        }

        const likeReactions = likeReactionsResult.data;

        if (likeReactions.page.length === 0) {
            const paginatedLikes: Paginated<Like> = {
                page: [],
            };

            const reply = new Success<Paginated<Like>>(paginatedLikes);

            return reply;
        }

        const likeDocumentRefs = likeReactions.page.map((likeReaction) => {
            const likeDocumentPath = DBCollections.likes + `${likeReaction.id}`;
            const likeDocumentRef =
                DatabaseAssistant.shared.doc(likeDocumentPath);

            return likeDocumentRef;
        });

        const likeDocuments = await DatabaseAssistant.shared.getAll(
            ...likeDocumentRefs
        );

        const likes: Like[] = [];

        for (let likeDocument of likeDocuments) {
            if (!likeDocument.exists) {
                const reply = new Failure<PaginatedLikesFailureReason>(
                    PaginatedLikesFailureReason.unknown
                );

                return reply;
            }

            const like = likeDocument.data() as unknown as Like;

            likes.push(like);
        }

        const paginatedLikes: Paginated<Like> = {
            page: likes,
            nextToken: likeReactions.nextToken,
        };

        const reply = new Success<Paginated<Like>>(paginatedLikes);

        return reply;
    }

    async viewableLikes(
        parameters: {
            tweetId: String;
        } & PaginationParameters &
            ViewablesParameters
    ): Promise<
        | Success<Paginated<ViewableLike>>
        | Failure<PaginatedViewableLikesFailureReason>
    > {
        const likeReactionsResult = await this.likes({
            tweetId: parameters.tweetId,
            limit: parameters.limit,
            nextToken: parameters.nextToken,
        });

        if (likeReactionsResult instanceof Failure) {
            switch (likeReactionsResult.reason) {
                case PaginatedLikesFailureReason.malformedParameters: {
                    const reply =
                        new Failure<PaginatedViewableLikesFailureReason>(
                            PaginatedViewableLikesFailureReason.malformedParameters
                        );

                    return reply;
                }
                default: {
                    const reply =
                        new Failure<PaginatedViewableLikesFailureReason>(
                            PaginatedViewableLikesFailureReason.unknown
                        );

                    return reply;
                }
            }
        }

        const likeReactions = likeReactionsResult.data;

        if (likeReactions.page.length === 0) {
            const paginatedViewableLikes: Paginated<ViewableLike> = {
                page: [],
            };

            const reply = new Success<Paginated<ViewableLike>>(
                paginatedViewableLikes
            );

            return reply;
        }

        const viewableUsersResult = await UsersManager.shared.viewableUsers({
            userIdentifiers: likeReactions.page.map((like) => {
                return like.authorId;
            }),
            viewerId: parameters.viewerId,
        });

        if (viewableUsersResult instanceof Failure) {
            const reply = new Failure<PaginatedViewableLikesFailureReason>(
                PaginatedViewableLikesFailureReason.unknown
            );

            return reply;
        }

        const viewableUsers = viewableUsersResult.data;

        const viewablesLikes = likeReactions.page.map((likeReaction) => {
            const likeViewables: LikeViewables = {
                author: viewableUsers[likeReaction.authorId.valueOf()],
            };

            const viewableLike: ViewableLike = {
                ...likeReaction,
                viewables: likeViewables,
            };

            return viewableLike;
        });

        const paginatedViewableLikes: Paginated<ViewableLike> = {
            page: viewablesLikes,
            nextToken: likeReactions.nextToken,
        };

        const reply = new Success<Paginated<ViewableLike>>(
            paginatedViewableLikes
        );

        return reply;
    }
}
