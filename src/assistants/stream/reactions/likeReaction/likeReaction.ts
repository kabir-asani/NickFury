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
    AddLikeFailure,
    LikeReaction,
    PaginatedLikeReactionsFailure,
    RemoveLikeFailure,
} from "./types";

export default class LikeReactionAssistant extends ReactionsAssistant {
    private static readonly kind = "like";

    constructor(parameters: { client: StreamClient }) {
        super({
            type: LikeReactionAssistant.kind,
            client: parameters.client,
        });
    }

    async addLike(parameters: {
        tweetId: String;
    }): Promise<Success<LikeReaction> | Failure<AddLikeFailure>> {
        try {
            const reaction = await this.client.reactions.add(
                this.type.valueOf(),
                parameters.tweetId.valueOf()
            );

            const likeReaction: LikeReaction = {
                id: reaction.id,
            };

            const result = new Success<LikeReaction>(likeReaction);

            return result;
        } catch (e) {
            logger(e, LogLevel.attention, [this, this.addLike]);

            const result = new Failure<AddLikeFailure>(AddLikeFailure.unknown);

            return result;
        }
    }

    async removeLike(parameters: {
        likeId: String;
    }): Promise<Success<Empty> | Failure<RemoveLikeFailure>> {
        try {
            await this.client.reactions.delete(parameters.likeId.valueOf());

            const result = new Success<Empty>({});

            return result;
        } catch (e) {
            logger(e, LogLevel.attention, [this, this.removeLike]);

            const result = new Failure<RemoveLikeFailure>(
                RemoveLikeFailure.unknown
            );

            return result;
        }
    }

    async likes(
        parameters: {
            tweetId: String;
        } & PaginationParameters
    ): Promise<
        | Success<Paginated<LikeReaction>>
        | Failure<PaginatedLikeReactionsFailure>
    > {
        try {
            const limit = Math.min(
                parameters.limit?.valueOf() || kMaximumPaginatedPageLength,
                kMaximumPaginatedPageLength
            );

            const reactions = await this.client.reactions.filter({
                activity_id: parameters.tweetId.valueOf(),
                kind: LikeReactionAssistant.kind,
                limit: limit,
                id_lt: parameters.nextToken?.valueOf(),
            });

            const likes = reactions.results.map<LikeReaction>((reaction) => {
                const like: LikeReaction = {
                    id: reaction.id,
                };

                return like;
            });

            const paginatedLikeReactions: Paginated<LikeReaction> = {
                page: likes,
                nextToken: reactions.next,
            };

            const reply = new Success<Paginated<LikeReaction>>(
                paginatedLikeReactions
            );

            return reply;
        } catch (e) {
            logger(e, LogLevel.attention, [this, this.likes]);

            if (e instanceof StreamApiError) {
                if (e.response.status === 400) {
                    const reply = new Failure<PaginatedLikeReactionsFailure>(
                        PaginatedLikeReactionsFailure.malformedParameters
                    );

                    return reply;
                }
            }

            const reply = new Failure<PaginatedLikeReactionsFailure>(
                PaginatedLikeReactionsFailure.unknown
            );

            return reply;
        }
    }
}
