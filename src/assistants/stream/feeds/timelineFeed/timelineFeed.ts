import { StreamClient } from "getstream";
import { FeedAssistant } from "../feed";

export class TimelineFeedAssistant extends FeedAssistant {
    private static feed = "timeline";

    constructor(parameters: {
        client: StreamClient;
    }) {
        super({
            type: TimelineFeedAssistant.feed,
            client: parameters.client
        });
    }
}