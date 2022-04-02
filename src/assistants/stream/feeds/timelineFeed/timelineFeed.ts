import { FlatActivity, StreamClient } from "getstream";
import { Paginated, PaginationQuery } from "../../../../managers/core/types";
import { Empty, Failure, Success } from "../../../../utils/typescriptx/typescriptx";
import { FeedAssistant } from "../feed";
import { UserFeedAssistant } from "../userFeed/userFeed";
import { PartialTweet } from "../types";
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
                UserFeedAssistant.feed,
                parameters.followingUserId.valueOf(),
            );

            const result = new Success<Empty>({});
            return result;
        } catch {
            const result = new Failure<FollowFeedFailure>(FollowFeedFailure.UNKNOWN);
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
                UserFeedAssistant.feed,
                parameters.followingUserId.valueOf(),
            );

            const result = new Success<Empty>({});
            return result;
        } catch {
            const result = new Failure<UnfollowFeedFailure>(UnfollowFeedFailure.UNKNOWN);
            return result;
        }
    }

    async activities(parameters: {
        userId: String;
    } & PaginationQuery): Promise<Paginated<PartialTweet> | null> {
        const feed = this.client.feed(
            this.type.valueOf(),
            parameters.userId.valueOf(),
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
                        tweetId: activity.object as String,
                        foreignTweetId: activity.foreign_id as String,
                    });

                    return partialTweet;
                });

            const result = new Paginated<PartialTweet>({
                page: partialTweets,
                nextToken:
                    flatPaginatedFeed.next !== undefined || flatPaginatedFeed.next !== null
                        ? partialTweets[partialTweets.length - 1].tweetId
                        : undefined,
            });
            return result;
        } catch {
            const result = null;
            return result;
        }
    }
}