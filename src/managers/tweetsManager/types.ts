import { Tweet } from "./models";

class TweetSuccess { }
class TweetFailure { }

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
