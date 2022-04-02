export interface Tweet {
    readonly tweetId: String;
    readonly complimentaryTweetId: String;
    readonly text: String;
    readonly creationDate: String;
    readonly authorId: String;
    readonly meta: {
        readonly likesCount: Number;
    }
}