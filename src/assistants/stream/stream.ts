import * as Stream from 'getstream';
import { StreamClient } from 'getstream';
import Secrets from '../../secrets.json';
import { SamaritanFeedAssistant } from './feeds/samaritanFeed/samaritanFeed';
import { TimelineFeedAssistant } from './feeds/timelineFeed/timelineFeed';

export class StreamAssistant {
    public static readonly shared = new StreamAssistant();

    private client: StreamClient;

    readonly samaritanFeed: SamaritanFeedAssistant;
    readonly timelineFeed: TimelineFeedAssistant;

    constructor() {
        this.client = Stream.connect(
            process.env.STREAM_KEY || Secrets.stream.key,
            process.env.STREAM_SECRET || Secrets.stream.secret,
        );

        this.samaritanFeed = new SamaritanFeedAssistant({
            client: this.client
        });

        this.timelineFeed = new TimelineFeedAssistant({
            client: this.client
        });
    }
}
