import { ViewableUser } from "../../usersManager/models";

export interface Comment {
    readonly id: String;
    readonly text: String;
    readonly tweetId: String;
    readonly authorId: String;
}

export interface ViewableComment {
    readonly author: ViewableUser;
}