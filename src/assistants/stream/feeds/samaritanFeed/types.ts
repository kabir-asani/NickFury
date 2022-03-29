import { StreamAssistantSuccess, StreamAssistantFailure } from "../../types";

export class TweetActivity {
    readonly tid: String;
    readonly sid: String;

    constructor(parameters: {
        tid: String;
        sid: String;
    }) {
        this.tid = parameters.tid;
        this.sid = parameters.sid;
    }
}

// Add Tweet
export class AddTweetSuccess extends StreamAssistantSuccess {
    readonly tid: String;

    constructor(parameters: {
        tid: String
    }) {
        super();
        this.tid = parameters.tid;
    }
}

export class AddTweetFailure extends StreamAssistantFailure { }

export class UnknownAddTweetFailure extends AddTweetFailure { }

// Remove Tweet
export class RemoveTweetSuccess extends StreamAssistantSuccess { }

export class RemoveTweetFailure extends StreamAssistantFailure { }

export class UnknownRemoveTweetFailure extends RemoveTweetFailure { }


// Tweets
export class Tweets {
    tweets: TweetActivity[];
    nextToken?: String;

    constructor(parameters: {
        tweets: TweetActivity[];
        nextToken?: String;
    }) {
        this.tweets = parameters.tweets;
        this.nextToken = parameters.nextToken;
    }
}