import { Paginated } from "../../core/types";
import { Like } from "./models";

export class LikesManager {
    public static readonly shared = new LikesManager();

    async exists(parameters: {
        tweetId: String;
        athorId?: String;
        likeId?: String;
    }): Promise<boolean> {
        const result = false;
        return result;
    }

    async like(parameters: {
        tweetId: String;
        athorId?: String;
        likeId?: String;
    }): Promise<Like | null> {
        const result = null;
        return result;
    }

    async likes(parameters: {
        tweetId: String;
        limit?: Number;
        nextToken?: String;
    }): Promise<Paginated<Like> | null> {
        const result = null;
        return result;
    }
}