import { FlatActivity, StreamClient } from "getstream";
import { kMaximumPaginatedPageLength, Paginated, PaginationParameters } from "../../../../managers/core/types";
import { Empty, Failure, Success } from "../../../../utils/typescriptx/typescriptx";
import { FeedAssistant } from "../feed";
import { SelfFeedAssistant } from "../selfFeed/selfFeed";
import { TweetActivity } from "../types";
import { FollowFeedFailure, UnfollowFeedFailure } from "./types";

export class TimelineFeedAssistant extends FeedAssistant {
    public static readonly feed = "timeline";

    constructor(parameters: {
        client: StreamClient;
    }) {
        super({
            type: TimelineFeedAssistant.feed,
            client: parameters.client
        });
    }

    async follow(parameters: {
        followerUserId: String;
        followingUserId: String;
    }): Promise<Success<Empty> | Failure<FollowFeedFailure>> {
        const timelineFeed = this.client.feed(
            this.type.valueOf(),
            parameters.followerUserId.valueOf(),
        );

        try {
            await timelineFeed.follow(
                SelfFeedAssistant.feed,
                parameters.followingUserId.valueOf(),
            );

            const result = new Success<Empty>({});

            return result;
        } catch {
            const result = new Failure<FollowFeedFailure>(
                FollowFeedFailure.UNKNOWN
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
            parameters.followerUserId.valueOf(),
        );

        try {
            await timelineFeed.unfollow(
                SelfFeedAssistant.feed,
                parameters.followingUserId.valueOf(),
            );

            const result = new Success<Empty>({});

            return result;
        } catch {
            const result = new Failure<UnfollowFeedFailure>(
                UnfollowFeedFailure.UNKNOWN
            );

            return result;
        }
    }

    async activities(parameters: {
        userId: String;
    } & PaginationParameters): Promise<Paginated<TweetActivity> | null> {
        const feed = this.client.feed(
            this.type.valueOf(),
            parameters.userId.valueOf(),
        );

        try {
            const flatFeed = await feed.get({
                id_gt: parameters.nextToken?.valueOf(),
                limit: Math.min(
                    parameters.limit?.valueOf() || kMaximumPaginatedPageLength,
                    kMaximumPaginatedPageLength
                ),
            });

            const flatActivities = flatFeed.results as FlatActivity[];

            const tweetActivities = flatActivities
                .map((activity) => {
                    const tweetActivity: TweetActivity = {
                        authorId: activity.actor,
                        tweetId: activity.object as String,
                        complimentaryTweetId: activity.foreign_id as String,
                    };

                    return tweetActivity;
                });

            const result: Paginated<TweetActivity> = {
                page: tweetActivities,
                nextToken: flatFeed.next,
            };

            return result;
        } catch {
            const result = null;

            return result;
        }
    }
}