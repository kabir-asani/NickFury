import { StreamClient } from "getstream";

export class ReactionsAssistant {
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