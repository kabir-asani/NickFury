import { Samaritan } from "../../samaritansManager/models";

export interface Like {
    readonly likeId: String;
    readonly authorId: String;
}

export interface EnrichedLike extends Like {
    author: Samaritan;
}