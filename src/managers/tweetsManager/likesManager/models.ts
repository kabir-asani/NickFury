import { User } from "../../usersManager/models";

export interface Like {
    readonly likeId: String;
    readonly authorId: String;
}

export interface EnrichedLike extends Like {
    author: User;
}