import { ViewableUser } from "../../usersManager/models";

export interface Like {
    readonly id: String;
    readonly tweetId: String;
    readonly authorId: String;
    readonly creationDate: String;
}

export interface ViewableLike {
    readonly author: ViewableUser;
}