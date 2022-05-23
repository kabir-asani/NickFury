export interface TweetActivity {
    readonly tweetId: String;
    readonly externalTweetId: String;
    readonly authorId: String;
}

export interface BookmarkActivity {
    readonly bookmarkId: String;
    readonly tweetId: String;
    readonly authorId: String;
}