import { EnrichedTweet } from "../../tweetsManager/models";

export interface Bookmark {
    readonly tweetId: String;
}

export interface EnrichedBookmark extends Bookmark {
    tweet: EnrichedTweet;
}