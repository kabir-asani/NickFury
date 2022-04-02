import { Empty, Failure, Success } from "../../../../utils/typescriptx/typescriptx";
import { Paginated, PaginationQuery } from "../../../core/types";
import { Like } from "./models";
import { DeleteLikeFailure, LikeFailure, LikesFeedFailure } from "./types";

export class LikesManager {
    public static readonly shared = new LikesManager();

    async exists(parameters: {
        tweetId: String;
        athorId?: String;
        likeId?: String;
    }): Promise<boolean> {
        // TODO: Implement
        const result = false;
        return result;
    }

    async createLike(parameters: {
        tweetId: String;
        authorId: String;
    }): Promise<Success<Like> | Failure<LikeFailure>> {
        // TODO: Implement
        const result = new Failure<LikeFailure>(LikeFailure.LIKE_DOES_NOT_EXISTS);
        return result;
    }

    async like(parameters: {
        likedId: String;
    }): Promise<Success<Like> | Failure<LikeFailure>> {
        // TODO: Implement
        const result = new Failure<LikeFailure>(LikeFailure.UNKNOWN);
        return result;
    }

    async likes(parameters: {
        tweetId: String;
    } & PaginationQuery): Promise<Success<Paginated<Like>> | Failure<LikesFeedFailure>> {
        // TODO: Implement
        const result = new Failure<LikesFeedFailure>(LikesFeedFailure.UNKNOWN);
        return result;
    }

    async deleteLike(parameters: {
        likeId: String;
    }): Promise<Success<Empty> | Failure<DeleteLikeFailure>> {
        // TODO: Implement
        const result = new Failure<DeleteLikeFailure>(DeleteLikeFailure.UNKNOWN);
        return result;
    }
}