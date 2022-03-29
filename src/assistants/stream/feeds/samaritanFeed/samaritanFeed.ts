import { assert } from "console";
import {
    StreamClient,
    NewActivity,
    FlatActivity
} from "getstream";
import { FeedAssistant } from "../feed";
import {
    AddTweetSuccess,
    AddTweetFailure,
    UnknownAddTweetFailure,
    RemoveTweetSuccess,
    RemoveTweetFailure,
    UnknownRemoveTweetFailure,
    TweetActivity,
    Tweets
} from "./types";

export class SamaritanFeedAssistant extends FeedAssistant {
    private static feed = "samaritan";
    private static verb = "tweet";

    constructor(parameters: {
        client: StreamClient;
    }) {
        super({
            type: SamaritanFeedAssistant.feed,
            client: parameters.client
        });
    }

    async addTweet(parameters: {
        sid: String;
        fid: String;
    }): Promise<AddTweetSuccess | AddTweetFailure> {
        const feed = this.client.feed(
            this.type.valueOf(),
            parameters.sid.valueOf()
        );

        const newActivity: NewActivity = {
            actor: parameters.sid.valueOf(),
            verb: SamaritanFeedAssistant.verb,
            object: parameters.fid.valueOf(),
        };

        try {
            const addActivityResult = await feed.addActivity(newActivity);

            const result = new AddTweetSuccess({
                tid: addActivityResult.id
            });
            return result;
        } catch {
            const result = new UnknownAddTweetFailure();
            return result;
        }
    }

    async removeTweet(parameters: {
        sid: String;
        fid: String;
    }): Promise<RemoveTweetSuccess | RemoveTweetFailure> {
        const feed = this.client.feed(
            this.type.valueOf(),
            parameters.sid.valueOf()
        );

        try {
            await feed.removeActivity({
                foreignId: parameters.fid.valueOf()
            });

            const result = new RemoveTweetSuccess();
            return result;
        } catch {
            const result = new UnknownRemoveTweetFailure();
            return result;
        }
    }

    async tweets(parameters: {
        sid: String;
        nextToken?: String;
    }): Promise<Tweets | null> {
        const feed = this.client.feed(
            this.type.valueOf(),
            parameters.sid.valueOf(),
        );

        try {
            const feedResult = await feed.get({
                id_lt: parameters.nextToken?.valueOf(),
            });

            const feedActivities = feedResult.results as FlatActivity[];

            const tweets = feedActivities
                .map((feedActivity) => {
                    const activity: TweetActivity = new TweetActivity({
                        sid: feedActivity.actor,
                        tid: feedActivity.object as String
                    });

                    return activity;
                });

            if (tweets.length > 0) {
                const result = new Tweets({
                    tweets: tweets,
                    nextToken:
                        feedResult.next !== undefined || feedResult.next !== null
                            ? tweets[tweets.length - 1].tid
                            : undefined,
                });
                return result;
            }

            const result = null;
            return result;
        } catch {
            const result = null;
            return result;
        }
    }
}