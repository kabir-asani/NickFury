import * as Stream from 'getstream';
import { NewActivity, StreamClient } from 'getstream';
import Secrets from '../../secrets.json';
import { Activity, AddActivityFailure, AddActivitySuccess, UnknownAddActivityFailure } from './types';

export class StreamAssistant {
    public static readonly shared = new StreamAssistant();

    private client: StreamClient;

    readonly samaritanFeed: SamaritanFeedAssistant;
    readonly timelineFeed: TimelineFeedAssistant;

    constructor() {
        this.client = Stream.connect(
            Secrets.stream.key,
            Secrets.stream.secret
        );

        this.samaritanFeed = new SamaritanFeedAssistant({
            client: this.client
        });

        this.timelineFeed = new TimelineFeedAssistant({
            client: this.client
        });
    }

    token(parameters: {
        sid: String;
    }): String {
        const token = this.client.createUserToken(parameters.sid.valueOf());
        return token;
    }
}

abstract class FeedAssistant {
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

class SamaritanFeedAssistant extends FeedAssistant {
    constructor(parameters: {
        client: StreamClient;
    }) {
        super({
            type: "samaritan",
            client: parameters.client
        });
    }

    async addTweet(parameters: {
        authorSid: String;
        foreignId: String;
    }): Promise<AddActivitySuccess | AddActivityFailure> {
        const feed = this.client.feed(
            this.type.valueOf(),
            parameters.authorSid.valueOf()
        );

        const newActivity: NewActivity = {
            actor: parameters.authorSid.valueOf(),
            verb: "tweet",
            object: parameters.foreignId.valueOf(),
        };

        try {
            const activityResult = await feed.addActivity(newActivity);

            const result = new AddActivitySuccess({
                tid: activityResult.id
            });
            return result;
        } catch {
            const result = new UnknownAddActivityFailure();
            return result;
        }
    }

    async removeTweet(parameters: {
        authorSid: String;
        tweetSid: String;
    }) {
        const feed = this.client.feed(
            this.type.valueOf(),
            parameters.authorSid.valueOf()
        );

        await feed.removeActivity({
            foreignId: parameters.tweetSid.valueOf()
        });
    }

    async tweets(parameters: {
        authorSid: String;
    }) {
        const feed = this.client.feed(
            this.type.valueOf(),
            parameters.authorSid.valueOf()
        );

        feed.get();
    }
}

class TimelineFeedAssistant extends FeedAssistant {
    constructor(parameters: {
        client: StreamClient;
    }) {
        super({
            type: "samaritan",
            client: parameters.client
        });
    }
}