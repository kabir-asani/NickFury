import { User } from "../models";

export interface Tweet {
    readonly id: String;
    readonly complimentaryTweetId: String;
    readonly text: String;
    readonly creationDate: String;
    readonly authorId: String;
    readonly meta: {
        readonly likesCount: Number;
    }
}

export interface EnrichedTweet extends Tweet {
    readonly author: User;
}

export interface TweetViewerMeta {
    liked: Boolean;
    bookmarked: Boolean;
}

export interface ViewableTweet extends EnrichedTweet {
    readonly viewerMeta: TweetViewerMeta;
}
