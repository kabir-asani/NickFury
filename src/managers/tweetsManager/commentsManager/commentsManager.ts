import {
    Empty,
    Failure,
    Success,
} from "../../../utils/typescriptx/typescriptx";
import {
    Comment,
    CommentViewables,
    Tweet,
    ViewableComment,
    ViewableUser,
} from "../../core/models";
import {
    kMaximumPaginatedPageLength,
    Paginated,
    PaginationParameters,
    ViewablesParameters,
} from "../../core/types";
import {
    CommentCreationFailureReason,
    CommentDeletionFailureReason,
    PaginatedCommentsFailureReason,
    PaginatedViewableCommentsFailureReason,
} from "./types";
import * as uuid from "uuid";
import DatabaseAssistant, {
    DBCollections,
} from "../../../assistants/database/database";
import Dately from "../../../utils/dately/dately";
import logger, { LogLevel } from "../../../utils/logger/logger";
import UsersManager from "../../usersManager/usersManager";

export default class CommentsManager {
    static readonly shared = new CommentsManager();

    private constructor() {}

    async exists(parameters: { commentId: String }): Promise<Boolean> {
        const commentsCollection = DatabaseAssistant.shared.collectionGroup(
            DBCollections.comments
        );

        const commentsQuery = commentsCollection
            .where("id", "==", parameters.commentId.valueOf())
            .limit(1);

        const querySnapshot = await commentsQuery.get();

        if (querySnapshot.docs.length > 0) {
            return true;
        }

        return false;
    }

    async create(parameters: {
        tweetId: String;
        authorId: String;
        comment: {
            text: String;
        };
    }): Promise<Success<Comment> | Failure<CommentCreationFailureReason>> {
        const comment: Comment = {
            id: uuid.v4(),
            text: parameters.comment.text,
            authorId: parameters.authorId,
            tweetId: parameters.tweetId,
            creationDate: Dately.shared.now(),
        };

        try {
            await DatabaseAssistant.shared.runTransaction(
                async (transaction) => {
                    const tweetDocumentPath =
                        DBCollections.tweets + `/${parameters.tweetId}`;
                    const tweetDocumentRef =
                        DatabaseAssistant.shared.doc(tweetDocumentPath);

                    const tweetDocument = await transaction.get(
                        tweetDocumentRef
                    );

                    const tweet = tweetDocument.data() as unknown as Tweet;

                    const commentDocumentPath =
                        tweetDocumentPath +
                        `/${DBCollections.comments}/${comment.id}`;
                    const commentDocumentRef =
                        DatabaseAssistant.shared.doc(commentDocumentPath);

                    transaction.create(commentDocumentRef, comment);
                    transaction.update(tweetDocumentRef, {
                        "interactionDetails.commentsCount":
                            tweet.interactionDetails.commentsCount.valueOf() +
                            1,
                    });

                    return comment;
                }
            );

            const reply = new Success<Comment>(comment);

            return reply;
        } catch (e) {
            logger(e, LogLevel.attention, [this, this.create]);

            const reply = new Failure<CommentCreationFailureReason>(
                CommentCreationFailureReason.unknown
            );

            return reply;
        }
    }

    async delete(parameters: {
        commentId: String;
    }): Promise<Success<Empty> | Failure<CommentDeletionFailureReason>> {
        const isCommentExists = await this.exists({
            commentId: parameters.commentId,
        });

        if (!isCommentExists) {
            const reply = new Failure<CommentDeletionFailureReason>(
                CommentDeletionFailureReason.commentDoesNotExists
            );

            return reply;
        }

        try {
            await DatabaseAssistant.shared.runTransaction(
                async (transaction) => {
                    const commentsCollection =
                        DatabaseAssistant.shared.collectionGroup(
                            DBCollections.comments
                        );

                    const commentsQuery = commentsCollection
                        .where("id", "==", parameters.commentId.valueOf())
                        .limit(1);

                    const querySnapshot = await transaction.get(commentsQuery);

                    const commentDocumentRef = querySnapshot.docs[0].ref;
                    const comment =
                        querySnapshot.docs[0].data() as unknown as Comment;

                    const tweetsCollection =
                        DatabaseAssistant.shared.collection(
                            DBCollections.tweets
                        );
                    const tweetDocumentRef = tweetsCollection.doc(
                        comment.tweetId.valueOf()
                    );
                    const tweetDocument = await transaction.get(
                        tweetDocumentRef
                    );

                    const tweet = tweetDocument.data() as unknown as Tweet;

                    transaction.delete(commentDocumentRef);
                    transaction.update(tweetDocumentRef, {
                        "interactionDetails.commentsCount": Math.max(
                            tweet.interactionDetails.commentsCount.valueOf() -
                                1,
                            0
                        ),
                    });
                }
            );

            const reply = new Success<Empty>({});

            return reply;
        } catch (e) {
            logger(e, LogLevel.attention, [this, this.delete]);

            const reply = new Failure<CommentDeletionFailureReason>(
                CommentDeletionFailureReason.unknown
            );

            return reply;
        }
    }

    async comment(parameters: { commentId: String }): Promise<Comment | null> {
        const commentsCollection = DatabaseAssistant.shared.collectionGroup(
            DBCollections.comments
        );

        const commentsQuery = commentsCollection
            .where("id", "==", parameters.commentId.valueOf())
            .limit(1);

        const commentsQuerySnapshot = await commentsQuery.get();

        if (commentsQuerySnapshot.docs.length > 0) {
            const comment =
                commentsQuerySnapshot.docs[0].data() as unknown as Comment;

            return comment;
        }

        return null;
    }

    async viewableComment(
        parameters: { commentId: String } & ViewablesParameters
    ): Promise<ViewableComment | null> {
        const comment = await this.comment({ commentId: parameters.commentId });

        if (comment === null) {
            return null;
        }

        const commentViewables = await this.commentViewables({
            authorId: comment.authorId,
            viewerId: parameters.viewerId,
        });

        if (commentViewables === null) {
            return null;
        }

        const viewableComment: ViewableComment = {
            ...comment,
            viewables: commentViewables,
        };

        return viewableComment;
    }

    private async commentViewables(parameters: {
        authorId: String;
        viewerId: String;
    }): Promise<CommentViewables | null> {
        const viewableAuthor = await UsersManager.shared.viewableUser({
            id: parameters.authorId,
            viewerId: parameters.viewerId,
        });

        if (viewableAuthor == null) {
            return null;
        }

        const viewables: CommentViewables = {
            author: viewableAuthor as ViewableUser,
        };

        return viewables;
    }

    async paginatedCommentsOf(
        parameters: {
            tweetId: String;
        } & PaginationParameters
    ): Promise<
        Success<Paginated<Comment>> | Failure<PaginatedCommentsFailureReason>
    > {
        const commentsCollectionPath =
            DBCollections.tweets +
            `/${parameters.tweetId}/` +
            DBCollections.comments;

        const commentsCollection = DatabaseAssistant.shared.collection(
            commentsCollectionPath
        );

        const limit =
            parameters.limit?.valueOf() || kMaximumPaginatedPageLength;

        let query = commentsCollection.orderBy("creationDate").limit(limit + 1);

        if (parameters.nextToken !== undefined) {
            query = query.startAt(parameters.nextToken);
        }

        try {
            const querySnapshot = await query.get();

            if (querySnapshot.empty) {
                const paginatedComments: Paginated<Comment> = {
                    page: [],
                };

                const reply = new Success<Paginated<Comment>>(
                    paginatedComments
                );

                return reply;
            }

            let nextToken = undefined;

            if (querySnapshot.docs.length === limit + 1) {
                const lastDocument = querySnapshot.docs.pop();

                if (lastDocument !== undefined) {
                    nextToken = (lastDocument.data() as unknown as Comment)
                        .creationDate;
                }
            }

            const comments = querySnapshot.docs.map((queryDocument) => {
                const bookmark = queryDocument.data() as unknown as Comment;

                return bookmark;
            });

            const paginatedComments: Paginated<Comment> = {
                page: comments,
                nextToken: nextToken,
            };

            const reply = new Success<Paginated<Comment>>(paginatedComments);

            return reply;
        } catch (e) {
            logger(e, LogLevel.attention, [this, this.paginatedCommentsOf]);

            const reply = new Failure<PaginatedCommentsFailureReason>(
                PaginatedCommentsFailureReason.unknown
            );

            return reply;
        }
    }

    async paginatedViewableCommentsOf(
        parameters: {
            tweetId: String;
        } & PaginationParameters &
            ViewablesParameters
    ): Promise<
        | Success<Paginated<ViewableComment>>
        | Failure<PaginatedViewableCommentsFailureReason>
    > {
        const commentsResult = await this.paginatedCommentsOf({
            tweetId: parameters.tweetId,
            limit: parameters.limit,
            nextToken: parameters.nextToken,
        });

        if (commentsResult instanceof Failure) {
            switch (commentsResult.reason) {
                case PaginatedCommentsFailureReason.malformedParameters: {
                    const reply =
                        new Failure<PaginatedViewableCommentsFailureReason>(
                            PaginatedViewableCommentsFailureReason.malformedParameters
                        );

                    return reply;
                }
                default: {
                    const reply =
                        new Failure<PaginatedViewableCommentsFailureReason>(
                            PaginatedViewableCommentsFailureReason.unknown
                        );

                    return reply;
                }
            }
        }

        const comments = commentsResult.data;

        if (comments.page.length === 0) {
            const paginatedViewableComments: Paginated<ViewableComment> = {
                page: [],
            };

            const reply = new Success<Paginated<ViewableComment>>(
                paginatedViewableComments
            );

            return reply;
        }

        const viewableUsersResult = await UsersManager.shared.viewableUsers({
            userIdentifiers: comments.page.map((comment) => {
                return comment.authorId;
            }),
            viewerId: parameters.viewerId,
        });

        if (viewableUsersResult instanceof Failure) {
            const reply = new Failure<PaginatedViewableCommentsFailureReason>(
                PaginatedViewableCommentsFailureReason.unknown
            );

            return reply;
        }

        const viewableUsers = viewableUsersResult.data;

        const viewablesComments = comments.page.map((comment) => {
            const commentViewables: CommentViewables = {
                author: viewableUsers[comment.authorId.valueOf()],
            };

            const viewableComment: ViewableComment = {
                ...comment,
                viewables: commentViewables,
            };

            return viewableComment;
        });

        const paginatedViewableComments: Paginated<ViewableComment> = {
            page: viewablesComments,
            nextToken: comments.nextToken,
        };

        const reply = new Success<Paginated<ViewableComment>>(
            paginatedViewableComments
        );

        return reply;
    }
}
