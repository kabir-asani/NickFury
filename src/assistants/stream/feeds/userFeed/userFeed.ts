import {
    StreamClient,
    FlatActivity
} from "getstream";
import { Paginated, PaginationQuery } from "../../../../managers/core/types";
import { Empty, Failure, Success } from "../../../../utils/typescriptx/typescriptx";
import { FeedAssistant } from "../feed";
import { PartialTweet } from "../types";
import {
    AddTweetActivityFailure,
    RemoveTweetActivityFailure,
    TweetActivity,
} from "./types";

export class UserFeedAssistant extends FeedAssistant {
    public static readonly feed = "self";
    private static readonly verb = "tweet";

    constructor(parameters: {
        client: StreamClient;
    }) {
        super({
            type: UserFeedAssistant.feed,
            client: parameters.client
        });
    }

    async createTweetActivity(parameters: {
        authorId: String;
        complimentaryTweetId: String;
    }): Promise<Success<TweetActivity> | Failure<AddTweetActivityFailure>> {
        const feed = this.client.feed(
            this.type.valueOf(),
            parameters.authorId.valueOf(),
        );

        try {
            const tweetActivity = await feed.addActivity({
                actor: parameters.authorId.valueOf(),
                verb: UserFeedAssistant.verb,
                object: parameters.complimentaryTweetId.valueOf(),
            });

            const result = new Success<TweetActivity>({
                id: tweetActivity.id,
            });
            return result;
        } catch {
            const result = new Failure<AddTweetActivityFailure>(AddTweetActivityFailure.UNKNOWN);
            return result;
        }
    }

    async remoteTweetActivity(parameters: {
        authorId: String;
        tweetId: String;
    }): Promise<Success<Empty> | Failure<RemoveTweetActivityFailure>> {
        const feed = this.client.feed(
            this.type.valueOf(),
            parameters.authorId.valueOf()
        );

        try {
            await feed.removeActivity(parameters.tweetId.valueOf());

            const result = new Success<Empty>({});
            return result;
        } catch {
            const result = new Failure<RemoveTweetActivityFailure>(RemoveTweetActivityFailure.UNKNOWN);
            return result;
        }
    }

    async activities(parameters: {
        authorId: String;
    } & PaginationQuery): Promise<Paginated<PartialTweet> | null> {
        const feed = this.client.feed(
            this.type.valueOf(),
            parameters.authorId.valueOf(),
        );

        try {
            const flatPaginatedFeed = await feed.get({
                id_gt: parameters.nextToken?.valueOf(),
                limit: Math.min(
                    parameters.limit?.valueOf() || 25,
                    100,
                ),
            });

            const activities = flatPaginatedFeed.results as FlatActivity[];

            const partialTweets = activities
                .map((activity) => {
                    const partialTweet: PartialTweet = new PartialTweet({
                        authorId: activity.actor,
                        tweetId: activity.id,
                        foreignTweetId: activity.foreign_id as String,
                    });

                    return partialTweet;
                });

            const result = new Paginated<PartialTweet>({
                page: partialTweets,
                nextToken: flatPaginatedFeed.next
            });
            return result;
        } catch {
            const result = null;
            return result;
        }
    }
}