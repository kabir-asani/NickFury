import { FlatActivity, StreamApiError, StreamClient } from "getstream";
import { ViewableTweet } from "../../../../managers/core/models";
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
import SelfFeedAssistant from "../selfFeed/selfFeed";
import { TweetActivity } from "../types";
import {
    FollowFeedFailure,
    TimelineTweetActivitiesFailureReason,
    UnfollowFeedFailure,
} from "./types";

export default class TimelineFeedAssistant extends FeedAssistant {
    public static readonly feed = "timeline";

    constructor(parameters: { client: StreamClient }) {
        super({
            type: TimelineFeedAssistant.feed,
            client: parameters.client,
        });
    }

    async follow(parameters: {
        followerUserId: String;
        followingUserId: String;
    }): Promise<Success<Empty> | Failure<FollowFeedFailure>> {
        const timelineFeed = this.client.feed(
            this.type.valueOf(),
            parameters.followerUserId.valueOf()
        );

        try {
            await timelineFeed.follow(
                SelfFeedAssistant.feed,
                parameters.followingUserId.valueOf()
            );

            const result = new Success<Empty>({});

            return result;
        } catch {
            const result = new Failure<FollowFeedFailure>(
                FollowFeedFailure.unknown
            );

            return result;
        }
    }

    async unfollow(parameters: {
        followerUserId: String;
        followingUserId: String;
    }): Promise<Success<Empty> | Failure<UnfollowFeedFailure>> {
        const timelineFeed = this.client.feed(
            this.type.valueOf(),
            parameters.followerUserId.valueOf()
        );

        try {
            await timelineFeed.unfollow(
                SelfFeedAssistant.feed,
                parameters.followingUserId.valueOf()
            );

            const result = new Success<Empty>({});

            return result;
        } catch {
            const result = new Failure<UnfollowFeedFailure>(
                UnfollowFeedFailure.unknown
            );

            return result;
        }
    }

    async activities(
        parameters: {
            userId: String;
        } & PaginationParameters
    ): Promise<
        | Success<Paginated<TweetActivity>>
        | Failure<TimelineTweetActivitiesFailureReason>
    > {
        const feed = this.client.feed(
            this.type.valueOf(),
            parameters.userId.valueOf()
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
                    tweetId: feedActivity.object as String,
                    externalTweetId: feedActivity.foreign_id as String,
                };

                return tweetActivity;
            });

            const paginatedTweetActivities: Paginated<TweetActivity> = {
                page: tweetActivities,
                nextToken: flatFeed.next || undefined,
            };

            const reply = new Success<Paginated<TweetActivity>>(
                paginatedTweetActivities
            );

            return reply;
        } catch (e) {
            logger(e, LogLevel.attention, [this, this.activities]);

            if (e instanceof StreamApiError) {
                if (e.response.status === 400) {
                    const reply =
                        new Failure<TimelineTweetActivitiesFailureReason>(
                            TimelineTweetActivitiesFailureReason.malformedParameters
                        );

                    return reply;
                }
            }

            const reply = new Failure<TimelineTweetActivitiesFailureReason>(
                TimelineTweetActivitiesFailureReason.malformedParameters
            );

            return reply;
        }
    }
}
