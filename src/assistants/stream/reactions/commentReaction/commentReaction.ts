import { StreamClient } from "getstream";
import { Paginated, PaginationQuery } from "../../../../managers/core/types";
import { Empty, Failure, Success } from "../../../../utils/typescriptx/typescriptx";
import { ReactionsAssistant } from "../../feeds/reactions";
import { AddCommentFailure, CommentsListFailure, PartialCommentReaction, RemoveCommentFailure } from "./types";

export class CommentReactionAssistant extends ReactionsAssistant {
    private static readonly kind = "comment";

    constructor(parameters: {
        client: StreamClient;
    }) {
        super({
            type: CommentReactionAssistant.kind,
            client: parameters.client
        });
    }

    async addComment(parameters: {
        tweetId: String;
    }): Promise<Success<PartialCommentReaction> | Failure<AddCommentFailure>> {
        try {
            const comment = await this.client.reactions.add(
                this.type.valueOf(),
                parameters.tweetId.valueOf(),
            );

            const partialComment: PartialCommentReaction = {
                id: comment.id
            };

            const result = new Success<PartialCommentReaction>(partialComment);
            return result;
        } catch {
            const result = new Failure<AddCommentFailure>(AddCommentFailure.UNKNOWN);
            return result;
        }
    }

    async commentsList(parameters: {
        tweetId: String;
    } & PaginationQuery): Promise<Success<Paginated<PartialCommentReaction>> | Failure<CommentsListFailure>> {
        try {
            const reactions = await this.client.reactions.filter({
                activity_id: parameters.tweetId.valueOf(),
                kind: CommentReactionAssistant.kind,
                limit: parameters.limit?.valueOf() || 25,
                id_lt: parameters.nextToken?.valueOf(),
            });

            const comments = reactions.results.map<PartialCommentReaction>((reaction) => {
                const comment: PartialCommentReaction = {
                    id: reaction.id
                };

                return comment;
            });

            const paginatedComments = new Paginated<PartialCommentReaction>({
                page: comments,
                nextToken: reactions.next,
            });

            const result = new Success<Paginated<PartialCommentReaction>>(paginatedComments);
            return result;
        } catch {
            const result = new Failure<CommentsListFailure>(CommentsListFailure.UNKNOWN);
            return result;
        }
    }

    async removeComment(parameters: {
        commentId: String;
    }): Promise<Success<Empty> | Failure<RemoveCommentFailure>> {
        try {
            await this.client.reactions.delete(parameters.commentId.valueOf());

            const result = new Success<Empty>({});
            return result;
        } catch {
            const result = new Failure<RemoveCommentFailure>(RemoveCommentFailure.UNKNOWN);
            return result;
        }
    }
}