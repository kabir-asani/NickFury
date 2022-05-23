import { StreamClient } from "getstream";
import { kMaximumPaginatedPageLength, Paginated, PaginationParameters } from "../../../../managers/core/types";
import { Empty, Failure, Success } from "../../../../utils/typescriptx/typescriptx";
import { ReactionsAssistant } from "../reactions";
import { AddCommentFailure, CommentsListFailure, CommentReaction, RemoveCommentFailure } from "./types";

export class CommentReactionAssistant extends ReactionsAssistant {
    static readonly kind = "comment";

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
    }): Promise<Success<CommentReaction> | Failure<AddCommentFailure>> {
        try {
            const comment = await this.client.reactions.add(
                this.type.valueOf(),
                parameters.tweetId.valueOf(),
            );

            const partialComment: CommentReaction = {
                id: comment.id
            };

            const result = new Success<CommentReaction>(partialComment);
            return result;
        } catch {
            const result = new Failure<AddCommentFailure>(AddCommentFailure.UNKNOWN);
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

    async comments(parameters: {
        tweetId: String;
    } & PaginationParameters): Promise<Paginated<CommentReaction> | null> {
        try {
            const limit = Math.min(
                parameters.limit?.valueOf() || kMaximumPaginatedPageLength,
                kMaximumPaginatedPageLength
            );

            const reactions = await this.client.reactions.filter({
                id_lt: parameters.nextToken?.valueOf(),
                activity_id: parameters.tweetId.valueOf(),
                kind: CommentReactionAssistant.kind,
                limit: limit,
            });

            const comments = reactions.results.map<CommentReaction>((reaction) => {
                const comment: CommentReaction = {
                    id: reaction.id
                };

                return comment;
            });

            const result: Paginated<CommentReaction> = {
                page: comments,
                nextToken: reactions.next,
            };

            return result;
        } catch {
            return null;
        }
    }
}