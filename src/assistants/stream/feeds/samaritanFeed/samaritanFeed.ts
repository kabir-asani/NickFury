import {
    StreamClient,
    NewActivity
} from "getstream";
import { FeedAssistant } from "../feed";
import {
    AddTweetSuccess,
    AddTweetFailure,
    UnknownAddTweetFailure,
    RemoveTweetSuccess,
    RemoveTweetFailure,
    UnknownRemoveTweetFailure
} from "./types";

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
    }): Promise<AddTweetSuccess | AddTweetFailure> {
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

            const result = new AddTweetSuccess({
                tid: activityResult.id
            });
            return result;
        } catch {
            const result = new UnknownAddTweetFailure();
            return result;
        }
    }

    async removeTweet(parameters: {
        authorSid: String;
        tweetSid: String;
    }): Promise<RemoveTweetSuccess | RemoveTweetFailure> {
        const feed = this.client.feed(
            this.type.valueOf(),
            parameters.authorSid.valueOf()
        );

        try {
            await feed.removeActivity({
                foreignId: parameters.tweetSid.valueOf()
            });

            const result = new RemoveTweetSuccess();
            return result;
        } catch {
            const result = new UnknownRemoveTweetFailure();
            return result;
        }
    }
}