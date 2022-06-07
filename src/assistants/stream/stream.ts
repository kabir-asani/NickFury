import * as Stream from "getstream";
import { StreamClient } from "getstream";
import { exit } from "process";
import SelfFeedAssistant from "./feeds/selfFeed/selfFeed";
import TimelineFeedAssistant from "./feeds/timelineFeed/timelineFeed";

export default class StreamAssistant {
    public static readonly shared = new StreamAssistant();

    private readonly client: StreamClient;

    readonly selfFeed: SelfFeedAssistant;
    readonly timelineFeed: TimelineFeedAssistant;

    private constructor() {
        this.client = Stream.connect(
            process.env.STREAM_KEY || exit(),
            process.env.STREAM_SECRET || exit()
        );

        this.selfFeed = new SelfFeedAssistant({
            client: this.client,
        });

        this.timelineFeed = new TimelineFeedAssistant({
            client: this.client,
        });
    }
}
