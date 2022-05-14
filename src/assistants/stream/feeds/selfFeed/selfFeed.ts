import {
    StreamClient,
    FlatActivity
} from "getstream";
import { MAXIMUM_PAGINATED_PAGE_LENGTH, Paginated, PaginationQuery } from "../../../../managers/core/types";
import { Empty, Failure, Success } from "../../../../utils/typescriptx/typescriptx";
import { FeedAssistant } from "../feed";
import { TweetActivity } from "../types";
import {
    AddTweetActivityFailure,
    RemoveTweetActivityFailure,
} from "./types";

export class SelfFeedAssistant extends FeedAssistant {
    public static readonly feed = "self";
    private static readonly verb = "tweet";

    constructor(parameters: {
        client: StreamClient;
    }) {
        super({
            type: SelfFeedAssistant.feed,
            client: parameters.client
        });
    }

    async addTweetActivity(parameters: {
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
                verb: SelfFeedAssistant.verb,
                object: parameters.complimentaryTweetId.valueOf(),
            });

            const result = new Success<TweetActivity>({
                tweetId: tweetActivity.id,
                authorId: parameters.authorId,
                complimentaryTweetId: parameters.complimentaryTweetId,
            });

            return result;
        } catch {
            const result = new Failure<AddTweetActivityFailure>(
                AddTweetActivityFailure.UNKNOWN
            );

            return result;
        }
    }

    async removeTweetActivity(parameters: {
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
            const result = new Failure<RemoveTweetActivityFailure>(
                RemoveTweetActivityFailure.UNKNOWN
            );

            return result;
        }
    }

    async activities(parameters: {
        authorId: String;
    } & PaginationQuery): Promise<Paginated<TweetActivity> | null> {
        const feed = this.client.feed(
            this.type.valueOf(),
            parameters.authorId.valueOf(),
        );

        try {
            const flatFeed = await feed.get({
                id_gt: parameters.nextToken?.valueOf(),
                limit: Math.min(
                    parameters.limit?.valueOf() || MAXIMUM_PAGINATED_PAGE_LENGTH,
                    MAXIMUM_PAGINATED_PAGE_LENGTH
                ),
            });

            const flatActivities = flatFeed.results as FlatActivity[];

            const tweetActivities = flatActivities
                .map((activity) => {
                    const tweetActivity: TweetActivity = {
                        authorId: activity.actor,
                        tweetId: activity.id,
                        complimentaryTweetId: activity.foreign_id as String,
                    };

                    return tweetActivity;
                });

            const result: Paginated<TweetActivity> = {
                page: tweetActivities,
                nextToken: flatFeed.next
            };

            return result;
        } catch {
            const result = null;

            return result;
        }
    }
}