import { ViewableTweet } from "../../tweetsManager/models";

export interface Bookmark {
    readonly id: String;
    readonly authorId: String;
    readonly tweetId: String;
}

export interface ViewableBookmark {
    readonly tweet: ViewableTweet;
}