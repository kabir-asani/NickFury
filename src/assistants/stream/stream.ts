import * as Stream from "getstream";
import { StreamClient } from "getstream";
import Secrets from "../../secrets.json";
import SelfFeedAssistant from "./feeds/selfFeed/selfFeed";
import TimelineFeedAssistant from "./feeds/timelineFeed/timelineFeed";

export default class StreamAssistant {
    public static readonly shared = new StreamAssistant();

    private readonly client: StreamClient;

    readonly selfFeed: SelfFeedAssistant;
    readonly timelineFeed: TimelineFeedAssistant;

    private constructor() {
        this.client = Stream.connect(
            process.env.STREAM_KEY || Secrets.stream.key,
            process.env.STREAM_SECRET || Secrets.stream.secret
        );

        this.selfFeed = new SelfFeedAssistant({
            client: this.client,
        });

        this.timelineFeed = new TimelineFeedAssistant({
            client: this.client,
        });
    }
}
