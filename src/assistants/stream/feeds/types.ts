export class PartialTweet {
    readonly tweetId: String;
    readonly foreignTweetId: String;
    readonly authorId: String;

    constructor(parameters: {
        tweetId: String;
        foreignTweetId: String;
        authorId: String;
    }) {
        this.tweetId = parameters.tweetId;
        this.foreignTweetId = parameters.foreignTweetId;
        this.authorId = parameters.authorId;
    }
}

export class PartialBookmark {
    readonly bookmarkId: String;
    readonly tweetId: String;
    readonly authorId: String;

    constructor(parameters: {
        bookmarkId: String;
        tweetId: String;
        authorId: String;
    }) {
        this.bookmarkId = parameters.bookmarkId;
        this.tweetId = parameters.tweetId;
        this.authorId = parameters.authorId;
    }
}