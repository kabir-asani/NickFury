import { NewActivity, StreamClient } from "getstream";
import { AddActivitySuccess, AddActivityFailure, UnknownAddActivityFailure } from "./types";

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

export class SamaritanFeedAssistant extends FeedAssistant {
    private static feed = "samaritan";

    constructor(parameters: {
        client: StreamClient;
    }) {
        super({
            type: SamaritanFeedAssistant.feed,
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