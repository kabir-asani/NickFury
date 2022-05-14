import { StreamClient } from "getstream";
import { Paginated, PaginationParameters } from "../../../../managers/core/types";
import { Empty, Failure, Success } from "../../../../utils/typescriptx/typescriptx";
import { ReactionsAssistant } from "../../feeds/reactions";
import { AddLikeFailure, LikesListFailure, PartialLikeReaction, RemoveLikeFailure } from "./types";

export class LikeReactionAssistant extends ReactionsAssistant {
    private static readonly kind = "like";

    constructor(parameters: {
        client: StreamClient;
    }) {
        super({
            type: LikeReactionAssistant.kind,
            client: parameters.client
        });
    }

    async addLike(parameters: {
        tweetId: String;
    }): Promise<Success<PartialLikeReaction> | Failure<AddLikeFailure>> {
        try {
            const like = await this.client.reactions.add(
                this.type.valueOf(),
                parameters.tweetId.valueOf(),
            );

            const partialLike: PartialLikeReaction = {
                id: like.id
            };

            const result = new Success<PartialLikeReaction>(partialLike);
            return result;
        } catch {
            const result = new Failure<AddLikeFailure>(AddLikeFailure.UNKNOWN);
            return result;
        }
    }

    async likesList(parameters: {
        tweetId: String;
    } & PaginationParameters): Promise<Success<Paginated<PartialLikeReaction>> | Failure<LikesListFailure>> {
        try {
            const reactions = await this.client.reactions.filter({
                activity_id: parameters.tweetId.valueOf(),
                kind: LikeReactionAssistant.kind,
                limit: parameters.limit?.valueOf() || 25,
                id_lt: parameters.nextToken?.valueOf(),
            });

            const likes = reactions.results.map<PartialLikeReaction>((reaction) => {
                const like: PartialLikeReaction = {
                    id: reaction.id
                };

                return like;
            });

            const paginatedLikes: Paginated<PartialLikeReaction> = {
                page: likes,
                nextToken: reactions.next,
            };

            const result = new Success<Paginated<PartialLikeReaction>>(paginatedLikes);
            return result;
        } catch {
            const result = new Failure<LikesListFailure>(LikesListFailure.UNKNOWN);
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
        } catch {
            const result = new Failure<RemoveLikeFailure>(RemoveLikeFailure.UNKNOWN);
            return result;
        }
    }
}