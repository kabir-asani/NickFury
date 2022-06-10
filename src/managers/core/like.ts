import { ViewableUser } from "./user";

export interface Like {
    readonly id: String;
    readonly tweetId: String;
    readonly authorId: String;
    readonly creationDate: String;
}

export interface ViewableLike extends Like {
    readonly viewables: LikeViewables;
}

export interface LikeViewables {
    author: ViewableUser;
}
