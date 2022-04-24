import { assert } from "console";
import { text } from "stream/consumers";
import { DatabaseAssistant } from "../../../assistants/database/database";
import { StreamAssistant } from "../../../assistants/stream/stream";
import { Empty, Failure, Success } from "../../../utils/typescriptx/typescriptx";
import { TxCollections } from "../../core/collections";
import { Paginated, PaginationQuery } from "../../core/types";
import { UsersManager } from "../../usersManager/usersManager";
import { Tweet } from "../models";
import { TweetsManager } from "../tweetsManager";
import { Comment } from "./models";
import { AddCommentFailure, RemoveCommentFailure, CommentFailure, CommentsFeedFailure } from "./types";

export class CommentsManager {
    public static readonly shared = new CommentsManager();

    async exists(parameters: {
        commentId?: String;
    } &
    {
        comment?: {
            authorId: String;
            tweetId: String;
        }
    }): Promise<boolean> {
        assert(
            parameters.comment !== undefined || parameters.commentId !== undefined,
            "Either of like or likeId should be present"
        );

        const commentsCollectionRef = DatabaseAssistant.shared.collectionGroup(TxCollections.comments);

        if (parameters.commentId !== undefined) {
            const commentsQuery = commentsCollectionRef.where(
                "id",
                "==",
                parameters.commentId.valueOf(),
            ).limit(1);


            try {
                const snapshot = await commentsQuery.get();

                if (snapshot.empty) {
                    return false;
                }

                return true;
            } catch {
                return false;
            }
        }

        if (parameters.comment !== undefined) {
            const commentsQuery = commentsCollectionRef.where(
                "tweetId",
                "==",
                parameters.comment.tweetId.valueOf(),
            ).where(
                "authorId",
                "==",
                parameters.comment.authorId.valueOf(),
            ).limit(1);

            try {
                const snapshot = await commentsQuery.get();

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

    async addComment(parameters: {
        tweetId: String;
        authorId: String;
        text: String;
    }): Promise<Success<Comment> | Failure<AddCommentFailure>> {
        if (parameters.text.length <= 0 || parameters.text.length > 280) {
            const result = new Failure<AddCommentFailure>(AddCommentFailure.MISFORMED_COMMENT);
            return result;
        }

        const isTweetExists = await TweetsManager.shared.exits({
            tweetId: parameters.tweetId.valueOf(),
        });

        if (!isTweetExists) {
            const result = new Failure<AddCommentFailure>(AddCommentFailure.TWEET_DOES_NOT_EXISTS);
            return result;
        }

        const isAuthorExists = await UsersManager.shared.exists({
            userId: parameters.authorId
        });

        if (!isAuthorExists) {
            const result = new Failure<AddCommentFailure>(AddCommentFailure.AUTHOR_DOES_NOT_EXISTS);
            return result;
        }

        const addCommentResult = await StreamAssistant.shared.commentReactions.addComment({
            tweetId: parameters.tweetId,
        });

        if (addCommentResult instanceof Failure) {
            const result = new Failure<AddCommentFailure>(AddCommentFailure.UNKNOWN);
            return result;
        }

        const comment: Comment = {
            id: addCommentResult.data.id,
            text: parameters.text,
            tweetId: parameters.tweetId,
            authorId: parameters.authorId,
        };

        try {
            // References
            const tweetsCollectionRef = DatabaseAssistant.shared.collection(TxCollections.tweets);
            const tweetDocumentRef = tweetsCollectionRef.doc(comment.tweetId.valueOf());

            const commentsCollectionRef = tweetDocumentRef.collection(TxCollections.likes);
            const commentDocumentRef = commentsCollectionRef.doc(comment.id.valueOf());

            await DatabaseAssistant.shared.runTransaction(async (transaction) => {
                const tweetDocument = await tweetDocumentRef.get();
                const tweet = tweetDocument.data() as unknown as Tweet;

                const updatedTweet: Tweet = {
                    ...tweet,
                    meta: {
                        ...tweet.meta,
                        commentsCount: tweet.meta.commentsCount.valueOf() + 1,
                    }
                };

                transaction.create(
                    commentDocumentRef,
                    comment
                );

                transaction.update(
                    tweetDocumentRef,
                    updatedTweet,
                );

                return Promise.resolve();
            });

            const result = new Success<Comment>(comment);
            return result;
        } catch {
            const result = new Failure<AddCommentFailure>(AddCommentFailure.UNKNOWN);
            return result;
        }
    }

    async comment(parameters: {
        commentId: String;
    }): Promise<Success<Comment> | Failure<CommentFailure>> {
        const commentsCollectionRef = DatabaseAssistant.shared.collectionGroup(TxCollections.comments);

        const commentsQuery = commentsCollectionRef.where(
            "id",
            "==",
            parameters.commentId.valueOf(),
        ).limit(1);

        try {
            const snapshot = await commentsQuery.get();

            if (snapshot.empty) {
                const result = new Failure<CommentFailure>(CommentFailure.COMMENT_DOES_NOT_EXISTS);
                return result;
            }

            const comment = snapshot.docs[0].data() as unknown as Comment;

            const result = new Success<Comment>(comment);
            return result;
        } catch {
            const result = new Failure<CommentFailure>(CommentFailure.UNKNOWN);
            return result;
        }
    }

    async commentsList(parameters: {
        tweetId: String;
    } & PaginationQuery): Promise<Success<Paginated<Comment>> | Failure<CommentsFeedFailure>> {
        const isTweetExists = await TweetsManager.shared.exits({
            tweetId: parameters.tweetId,
        });

        if (!isTweetExists) {
            const result = new Failure<CommentsFeedFailure>(CommentsFeedFailure.TWEET_DOES_NOT_EXISTS);
            return result;
        }

        const feedResult = await StreamAssistant.shared.commentReactions.commentsList({
            tweetId: parameters.tweetId,
            nextToken: parameters.nextToken,
            limit: parameters.limit,
        });

        if (feedResult instanceof Failure) {
            const result = new Failure<CommentsFeedFailure>(CommentsFeedFailure.UNKNOWN);
            return result;
        }

        const partialComments = feedResult.data.page;

        const comments: Comment[] = [];

        for (const partialComment of partialComments) {
            const commentResult = await this.comment({
                commentId: partialComment.id
            });

            if (commentResult instanceof Failure) {
                const result = new Failure<CommentsFeedFailure>(CommentsFeedFailure.UNKNOWN);
                return result;
            }

            const comment = commentResult.data;
            comments.push(comment);
        }

        const paginatedComments = new Paginated<Comment>({
            page: comments,
            nextToken: feedResult.data.nextToken,
        });

        const result = new Success<Paginated<Comment>>(paginatedComments);
        return result;
    }

    async deleteLike(parameters: {
        commentId: String;
    }): Promise<Success<Empty> | Failure<RemoveCommentFailure>> {
        const commentsCollectionRef = DatabaseAssistant.shared.collectionGroup(TxCollections.comments);

        const commentsQuery = commentsCollectionRef.where(
            "id",
            "==",
            parameters.commentId.valueOf(),
        ).limit(1);

        try {
            const snapshot = await commentsQuery.get();

            if (snapshot.empty) {
                const result = new Failure<RemoveCommentFailure>(RemoveCommentFailure.COMMENT_DOES_NOT_EXISTS);
                return result;
            }

            const commentDocumentRef = snapshot.docs[0].ref;
            const comment = snapshot.docs[0].data() as unknown as Comment;

            const removeCommentResult = await StreamAssistant.shared.likeReactions.removeLike({
                likeId: comment.id
            });

            if (removeCommentResult instanceof Failure) {
                const result = new Failure<RemoveCommentFailure>(RemoveCommentFailure.UNKNOWN);
                return result;
            }

            const tweetsCollectionRef = DatabaseAssistant.shared.collection(TxCollections.tweets);
            const tweetDocumentRef = tweetsCollectionRef.doc(comment.tweetId.valueOf());

            await DatabaseAssistant.shared.runTransaction(async (transaction) => {
                const tweetDocument = await tweetDocumentRef.get();
                const tweet = tweetDocument.data() as unknown as Tweet;

                const updatedTweet: Tweet = {
                    ...tweet,
                    meta: {
                        ...tweet.meta,
                        commentsCount: tweet.meta.likesCount.valueOf() - 1
                    }
                };

                transaction.delete(
                    commentDocumentRef,
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
            const result = new Failure<RemoveCommentFailure>(RemoveCommentFailure.UNKNOWN);
            return result;
        }
    }

}