import { StreamClient } from "getstream";

export abstract class FeedAssistant {
    type: String;
    client: StreamClient;

    constructor(parameters: {
        type: String;
        client: StreamClient;
    }) {
        this.type = parameters.type;
        this.client = parameters.client;
    }
}

