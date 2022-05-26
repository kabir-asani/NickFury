import { StreamClient } from "getstream";

export default abstract class FeedAssistant {
    type: String;
    client: StreamClient;

    constructor(parameters: { type: String; client: StreamClient }) {
        this.type = parameters.type;
        this.client = parameters.client;
    }
}
