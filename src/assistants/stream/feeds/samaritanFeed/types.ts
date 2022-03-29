import { StreamAssistantSuccess, StreamAssistantFailure, Activity } from "../../types";

// Add Activity
export class AddTweetSuccess extends StreamAssistantSuccess {
    tid: String;

    constructor(parameters: {
        tid: String
    }) {
        super();
        this.tid = parameters.tid;
    }
}

export class AddTweetFailure extends StreamAssistantFailure { }

export class UnknownAddTweetFailure extends AddTweetFailure { }

// Remove Activity
export class RemoveTweetSuccess extends StreamAssistantSuccess { }

export class RemoveTweetFailure extends StreamAssistantFailure { }

export class UnknownRemoveTweetFailure extends RemoveTweetFailure { }