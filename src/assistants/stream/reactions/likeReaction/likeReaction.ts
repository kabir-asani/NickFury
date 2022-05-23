import { StreamClient } from "getstream";
import { Paginated, PaginationParameters } from "../../../../managers/core/types";
import { Empty, Failure, Success } from "../../../../utils/typescriptx/typescriptx";
import { ReactionsAssistant } from "../reactions";
import { AddLikeFailure, LikesListFailure, LikeReaction, RemoveLikeFailure } from "./types";

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
    }): Promise<Success<LikeReaction> | Failure<AddLikeFailure>> {
        try {
            const like = await this.client.reactions.add(
                this.type.valueOf(),
                parameters.tweetId.valueOf(),
            );

            const partialLike: LikeReaction = {
                id: like.id
            };

            const result = new Success<LikeReaction>(partialLike);
            return result;
        } catch {
            const result = new Failure<AddLikeFailure>(AddLikeFailure.UNKNOWN);
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

    async likes(parameters: {
        tweetId: String;
    } & PaginationParameters): Promise<Paginated<LikeReaction> | null> {
        try {
            const reactions = await this.client.reactions.filter({
                activity_id: parameters.tweetId.valueOf(),
                kind: LikeReactionAssistant.kind,
                limit: parameters.limit?.valueOf() || 25,
                id_lt: parameters.nextToken?.valueOf(),
            });

            const likes = reactions.results.map<LikeReaction>((reaction) => {
                const like: LikeReaction = {
                    id: reaction.id
                };

                return like;
            });

            const result: Paginated<LikeReaction> = {
                page: likes,
                nextToken: reactions.next,
            };

            return result;
        } catch {
            return null;
        }
    }

}