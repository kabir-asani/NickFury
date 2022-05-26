import {
    StreamClient,
    FlatActivity,
    StreamApiError,
    Activity,
} from "getstream";
import {
    kMaximumPaginatedPageLength,
    Paginated,
    PaginationParameters,
} from "../../../../managers/core/types";
import logger, { LogLevel } from "../../../../utils/logger/logger";
import {
    Empty,
    Failure,
    Success,
} from "../../../../utils/typescriptx/typescriptx";
import FeedAssistant from "../feed";
import { TweetActivity } from "../types";
import {
    AddTweetActivityFailure,
    RemoveTweetActivityFailure,
    TweetActivitiesFailureReason,
} from "./types";

export default class SelfFeedAssistant extends FeedAssistant {
    static readonly feed = "self";
    static readonly verb = "tweet";

    constructor(parameters: { client: StreamClient }) {
        super({
            type: SelfFeedAssistant.feed,
            client: parameters.client,
        });
    }

    async addTweetActivity(parameters: {
        authorId: String;
        externalTweetId: String;
    }): Promise<Success<TweetActivity> | Failure<AddTweetActivityFailure>> {
        const feed = this.client.feed(
            this.type.valueOf(),
            parameters.authorId.valueOf()
        );

        try {
            const feedActivityDetails = {
                actor: parameters.authorId.valueOf(),
                verb: SelfFeedAssistant.verb,
                object: parameters.externalTweetId.valueOf(),
            };

            const feedActivity = await feed.addActivity(feedActivityDetails);

            const tweetActivity: TweetActivity = {
                tweetId: feedActivity.id,
                authorId: parameters.authorId,
                externalTweetId: parameters.externalTweetId,
            };

            const result = new Success<TweetActivity>(tweetActivity);

            return result;
        } catch (e) {
            logger(e, LogLevel.attention);

            const result = new Failure<AddTweetActivityFailure>(
                AddTweetActivityFailure.unknown
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
        } catch (e) {
            logger(e, LogLevel.attention);

            const result = new Failure<RemoveTweetActivityFailure>(
                RemoveTweetActivityFailure.unknown
            );

            return result;
        }
    }

    async activities(
        parameters: {
            authorId: String;
        } & PaginationParameters
    ): Promise<
        | Success<Paginated<TweetActivity>>
        | Failure<TweetActivitiesFailureReason>
    > {
        const feed = this.client.feed(
            this.type.valueOf(),
            parameters.authorId.valueOf()
        );

        try {
            const limit = Math.min(
                parameters.limit?.valueOf() || kMaximumPaginatedPageLength,
                kMaximumPaginatedPageLength
            );

            const flatFeed = await feed.get({
                id_gt: parameters.nextToken?.valueOf(),
                limit: limit,
            });

            const flatActivities = flatFeed.results as FlatActivity[];

            const tweetActivities = flatActivities.map((feedActivity) => {
                const tweetActivity: TweetActivity = {
                    authorId: feedActivity.actor,
                    tweetId: feedActivity.id,
                    externalTweetId: feedActivity.object as unknown as String,
                };

                return tweetActivity;
            });

            const paginatedTweetActvities: Paginated<TweetActivity> = {
                page: tweetActivities,
                nextToken: flatFeed.next || undefined,
            };

            const reply = new Success<Paginated<TweetActivity>>(
                paginatedTweetActvities
            );

            return reply;
        } catch (e) {
            logger(e, LogLevel.attention);

            if (e instanceof StreamApiError) {
                if (e.response.status === 400) {
                    const reply = new Failure<TweetActivitiesFailureReason>(
                        TweetActivitiesFailureReason.malformedParameters
                    );

                    return reply;
                }
            }

            const reply = new Failure<TweetActivitiesFailureReason>(
                TweetActivitiesFailureReason.unknown
            );

            return reply;
        }
    }
}
