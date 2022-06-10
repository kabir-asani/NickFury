import { ViewableUser } from "./user";

export interface Comment {
    readonly id: String;
    readonly tweetId: String;
    readonly authorId: String;
    readonly text: String;
    readonly creationDate: String;
}

export interface ViewableComment extends Comment {
    readonly viewables: CommentViewables;
}

export interface CommentViewables {
    readonly author: ViewableUser;
}
