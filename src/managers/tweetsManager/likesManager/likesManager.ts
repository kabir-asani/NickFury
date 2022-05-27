import DatabaseAssistant from "../../../assistants/database/database";
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
    kMaximumPaginatedPageLength,
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
import UsersManager from "../../usersManager/usersManager";
import logger, { LogLevel } from "../../../utils/logger/logger";

export default class LikesManager {
    static readonly shared = new LikesManager();

    private constructor() {}

    private createIdentifier(parameters: {
        authorId: String;
        tweetId: String;
    }): String {
        return `${parameters.authorId}:${parameters.tweetId}`;
    }

    async exists(parameters: { likeId: String }): Promise<Boolean> {
        const likesCollection =
            DatabaseAssistant.shared.likesCollectionGroupRef();

        const likesQuery = likesCollection
            .where("id", "==", parameters.likeId.valueOf())
            .limit(1);

        const querySnapshot = await likesQuery.get();

        if (querySnapshot.docs.length > 0) {
            return true;
        }

        return false;
    }

    async existsByDetails(parameters: {
        tweetId: String;
        authorId: String;
    }): Promise<Boolean> {
        const likeId = this.createIdentifier({
            tweetId: parameters.tweetId,
            authorId: parameters.authorId,
        });

        const likeDocumentRef = DatabaseAssistant.shared.likeDocumentRef({
            tweetId: parameters.tweetId,
            likeId: likeId,
        });

        const likeDocument = await likeDocumentRef.get();

        if (likeDocument.exists) {
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

        const likeDocumentRefs = parameters.tweetIds.map((tweetId) => {
            const likeId = this.createIdentifier({
                authorId: parameters.authorId,
                tweetId: tweetId,
            });

            const likeDocumentRef = DatabaseAssistant.shared.likeDocumentRef({
                tweetId: tweetId,
                likeId: likeId,
            });

            return likeDocumentRef;
        });

        const likeDocuments = await DatabaseAssistant.shared.all(
            ...likeDocumentRefs
        );

        const likeStatuses: Value<Boolean> = {};

        likeDocuments.forEach((bookmarkDocument) => {
            const tweetId = bookmarkDocument.id.split(":")[1];

            likeStatuses[tweetId] = bookmarkDocument.exists;
        });

        return likeStatuses;
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

        const likeId = this.createIdentifier({
            authorId: parameters.authorId,
            tweetId: parameters.tweetId,
        });

        const like: Like = {
            id: likeId,
            authorId: parameters.authorId,
            tweetId: parameters.tweetId,
            creationDate: Dately.shared.now(),
        };

        try {
            await DatabaseAssistant.shared.transaction(async (transaction) => {
                const tweetDocumentRef =
                    DatabaseAssistant.shared.tweetDocumentRef({
                        tweetId: parameters.tweetId,
                    });

                const tweetDocument = await transaction.get(tweetDocumentRef);

                const tweet = tweetDocument.data() as unknown as Tweet;

                const likeDocumentRef =
                    DatabaseAssistant.shared.likeDocumentRef({
                        tweetId: parameters.tweetId,
                        likeId: like.id,
                    });

                transaction.create(likeDocumentRef, like);
                transaction.update(tweetDocumentRef, {
                    "interactionDetails.likesCount":
                        tweet.interactionDetails.likesCount.valueOf() + 1,
                });

                return like;
            });

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

        try {
            await DatabaseAssistant.shared.transaction(async (transaction) => {
                const likesCollection =
                    DatabaseAssistant.shared.likesCollectionGroupRef();

                const likesQuery = likesCollection
                    .where("id", "==", parameters.likeId.valueOf())
                    .limit(1);

                const querySnapshot = await transaction.get(likesQuery);

                const likeDocumentRef = querySnapshot.docs[0].ref;
                const like = querySnapshot.docs[0].data() as unknown as Like;

                const tweetDocumentRef =
                    DatabaseAssistant.shared.tweetDocumentRef({
                        tweetId: like.tweetId,
                    });

                const tweetDocument = await transaction.get(tweetDocumentRef);

                const tweet = tweetDocument.data() as unknown as Tweet;

                transaction.delete(likeDocumentRef);
                transaction.update(tweetDocumentRef, {
                    "interactionDetails.likesCount": Math.max(
                        tweet.interactionDetails.likesCount.valueOf() - 1,
                        0
                    ),
                });
            });

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
        const likesCollection =
            DatabaseAssistant.shared.likesCollectionGroupRef();

        const likesQuery = likesCollection
            .where("id", "==", parameters.likeId.valueOf())
            .limit(1);

        const likesQuerySnapshot = await likesQuery.get();

        if (likesQuerySnapshot.docs.length > 0) {
            const like = likesQuerySnapshot.docs[0].data() as unknown as Like;

            return like;
        }

        return null;
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

    async paginatedLikesOf(
        parameters: {
            tweetId: String;
        } & PaginationParameters
    ): Promise<
        Success<Paginated<Like>> | Failure<PaginatedLikesFailureReason>
    > {
        const likesCollection = DatabaseAssistant.shared.likesCollectionRef({
            tweetId: parameters.tweetId,
        });

        const limit =
            parameters.limit?.valueOf() || kMaximumPaginatedPageLength;

        let query = likesCollection.orderBy("creationDate").limit(limit + 1);

        if (parameters.nextToken !== undefined) {
            query = query.startAt(parameters.nextToken);
        }

        try {
            const querySnapshot = await query.get();

            if (querySnapshot.empty) {
                const paginatedLikes: Paginated<Like> = {
                    page: [],
                };

                const reply = new Success<Paginated<Like>>(paginatedLikes);

                return reply;
            }

            let nextToken = undefined;

            if (querySnapshot.docs.length === limit + 1) {
                const lastDocument = querySnapshot.docs.pop();

                if (lastDocument !== undefined) {
                    nextToken = (lastDocument.data() as unknown as Like)
                        .creationDate;
                }
            }

            const likes = querySnapshot.docs.map((queryDocument) => {
                const bookmark = queryDocument.data() as unknown as Like;

                return bookmark;
            });

            const paginatedLikes: Paginated<Like> = {
                page: likes,
                nextToken: nextToken,
            };

            const reply = new Success<Paginated<Like>>(paginatedLikes);

            return reply;
        } catch (e) {
            logger(e, LogLevel.attention, [this, this.paginatedLikesOf]);

            const reply = new Failure<PaginatedLikesFailureReason>(
                PaginatedLikesFailureReason.unknown
            );

            return reply;
        }
    }

    async paginatedViewableLikesOf(
        parameters: {
            tweetId: String;
        } & PaginationParameters &
            ViewablesParameters
    ): Promise<
        | Success<Paginated<ViewableLike>>
        | Failure<PaginatedViewableLikesFailureReason>
    > {
        const likesResult = await this.paginatedLikesOf({
            tweetId: parameters.tweetId,
            limit: parameters.limit,
            nextToken: parameters.nextToken,
        });

        if (likesResult instanceof Failure) {
            switch (likesResult.reason) {
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

        const likes = likesResult.data;

        if (likes.page.length === 0) {
            const paginatedViewableLikes: Paginated<ViewableLike> = {
                page: [],
            };

            const reply = new Success<Paginated<ViewableLike>>(
                paginatedViewableLikes
            );

            return reply;
        }

        const viewableUsersResult = await UsersManager.shared.viewableUsers({
            userIdentifiers: likes.page.map((like) => {
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

        const viewablesLikes = likes.page.map((like) => {
            const likeViewables: LikeViewables = {
                author: viewableUsers[like.authorId.valueOf()],
            };

            const viewableLike: ViewableLike = {
                ...like,
                viewables: likeViewables,
            };

            return viewableLike;
        });

        const paginatedViewableLikes: Paginated<ViewableLike> = {
            page: viewablesLikes,
            nextToken: likes.nextToken,
        };

        const reply = new Success<Paginated<ViewableLike>>(
            paginatedViewableLikes
        );

        return reply;
    }
}
