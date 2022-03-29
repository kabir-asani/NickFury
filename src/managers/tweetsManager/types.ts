import { Tweet } from "./models";

class TweetSuccess { }
class TweetFailure { }

// Feed
export class Feed {
    readonly tweets: Tweet[];
    readonly nextToken?: String;

    constructor(parameters: {
        tweets: Tweet[];
        nextToken?: String;
    }) {
        this.tweets = parameters.tweets;
        this.nextToken = parameters.nextToken;
    }
}

// Create Tweet
export class CreateTweetSuccess extends TweetSuccess {
    readonly tweet: Tweet;

    constructor(parameters: {
        tweet: Tweet;
    }) {
        super();
        this.tweet = parameters.tweet;
    }
}

export abstract class CreateTweetFailure extends TweetFailure { }

export class UnkownCreateTweetFailure extends CreateTweetFailure { }

// Delete Tweet
export class DeleteTweetSuccess extends TweetSuccess { }

export abstract class DeleteTweetFailure extends TweetFailure { }

export class UnknownDeleteTweetFailure extends DeleteTweetFailure { }