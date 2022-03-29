import { StreamAssistantSuccess, StreamAssistantFailure } from "../../types";

export class PartialTweet {
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
export class Feed {
    partialTweets: PartialTweet[];
    nextToken?: String;

    constructor(parameters: {
        partialTweets: PartialTweet[];
        nextToken?: String;
    }) {
        this.partialTweets = parameters.partialTweets;
        this.nextToken = parameters.nextToken;
    }
}