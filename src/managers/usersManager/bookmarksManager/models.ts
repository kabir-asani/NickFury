import { EnrichedTweet } from "../../tweetsManager/models";

export interface Bookmark {
    readonly id: String;
    readonly tweetId: String;
    readonly authorId: String;
}