import { ViewableUser } from "./user";

export interface Tweet {
    readonly id: String;
    readonly externalId: String;
    readonly text: String;
    readonly authorId: String;
    readonly creationDate: String;
    readonly lastUpdatedDate: String;
    readonly interactionDetails: {
        readonly likesCount: Number;
        readonly commentsCount: Number;
    };
}

export interface TweetViewables {
    readonly author: ViewableUser;
    readonly bookmarked: Boolean;
    readonly liked: Boolean;
}

export interface ViewableTweet extends Tweet {
    readonly viewables: TweetViewables;
}
