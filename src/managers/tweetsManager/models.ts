import { User, ViewableUser } from "../usersManager/models";

export interface Tweet {
    readonly id: String;
    readonly complimentaryTweetId: String;
    readonly text: String;
    readonly creationDate: String;
    readonly authorId: String;
    readonly meta: {
        readonly likesCount: Number;
        readonly commentsCount: Number;
    }
}

export interface TweetViewerMeta {
    liked: Boolean;
    bookmarked: Boolean;
}

export interface ViewableTweet extends Tweet {
    readonly author: ViewableUser;
    readonly viewerMeta: TweetViewerMeta;
}
