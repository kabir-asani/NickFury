import { StreamApiError, StreamClient } from "getstream";
import {
    kMaximumPaginatedPageLength,
    Paginated,
    PaginationParameters,
} from "../../../../managers/core/types";
import logger, { LogLevel } from "../../../../utils/logger/logger";
import {
    Empty,
    Failure,
    Success,
} from "../../../../utils/typescriptx/typescriptx";
import { ReactionsAssistant } from "../reactions";
import {
    AddCommentReactionFailureReason,
    CommentReaction,
    PaginatedCommentReactionsFailure,
    RemoveCommentReactionFailureReason,
} from "./types";

export default class CommentReactionAssistant extends ReactionsAssistant {
    static readonly kind = "comment";

    constructor(parameters: { client: StreamClient }) {
        super({
            type: CommentReactionAssistant.kind,
            client: parameters.client,
        });
    }

    async addComment(parameters: {
        tweetId: String;
    }): Promise<
        Success<CommentReaction> | Failure<AddCommentReactionFailureReason>
    > {
        try {
            const reaction = await this.client.reactions.add(
                this.type.valueOf(),
                parameters.tweetId.valueOf()
            );

            const commentReaction: CommentReaction = {
                id: reaction.id,
            };

            const reply = new Success<CommentReaction>(commentReaction);

            return reply;
        } catch (e) {
            logger(e, LogLevel.attention, [this, this.addComment]);

            const reply = new Failure<AddCommentReactionFailureReason>(
                AddCommentReactionFailureReason.UNKNOWN
            );

            return reply;
        }
    }

    async removeComment(parameters: {
        commentId: String;
    }): Promise<Success<Empty> | Failure<RemoveCommentReactionFailureReason>> {
        try {
            await this.client.reactions.delete(parameters.commentId.valueOf());

            const reply = new Success<Empty>({});

            return reply;
        } catch (e) {
            logger(e, LogLevel.attention, [this, this.removeComment]);

            const reply = new Failure<RemoveCommentReactionFailureReason>(
                RemoveCommentReactionFailureReason.unknown
            );

            return reply;
        }
    }

    async comments(
        parameters: {
            tweetId: String;
        } & PaginationParameters
    ): Promise<
        | Success<Paginated<CommentReaction>>
        | Failure<PaginatedCommentReactionsFailure>
    > {
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

            const comments = reactions.results.map<CommentReaction>(
                (reaction) => {
                    const comment: CommentReaction = {
                        id: reaction.id,
                    };

                    return comment;
                }
            );

            const paginatedCommentReactions: Paginated<CommentReaction> = {
                page: comments,
                nextToken: reactions.next,
            };

            const reply = new Success<Paginated<CommentReaction>>(
                paginatedCommentReactions
            );

            return reply;
        } catch (e) {
            logger(e, LogLevel.attention, [this, this.comments]);

            if (e instanceof StreamApiError) {
                if (e.response.status === 400) {
                    const reply = new Failure<PaginatedCommentReactionsFailure>(
                        PaginatedCommentReactionsFailure.malformedParameters
                    );

                    return reply;
                }
            }

            const reply = new Failure<PaginatedCommentReactionsFailure>(
                PaginatedCommentReactionsFailure.unknown
            );

            return reply;
        }
    }
}
