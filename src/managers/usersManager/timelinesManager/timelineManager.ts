import { StreamAssistant } from "../../../assistants/stream/stream";
import { Paginated } from "../../core/types";
import { Tweet } from "../../tweetsManager/models";
import { TweetsManager } from "../../tweetsManager/tweetsManager";

export class TimelineManager {
    public static readonly shared = new TimelineManager();

    // TODO: Revisit to reply with Success and Failure
    async tweets(parameters: {
        userId: String;
        limit?: Number;
        nextToken?: String;
    }): Promise<Paginated<Tweet> | null> {
        const paginated = await StreamAssistant.shared.timelineFeed.tweets({
            userId: parameters.userId,
            limit: parameters.limit,
            nextToken: parameters.nextToken,
        });

        if (paginated !== null) {
            const tweets: Tweet[] = [];

            for (const partialTweet of paginated.page) {
                const tweet = await TweetsManager.shared.tweet({
                    tweetId: partialTweet.tweetId,
                });

                if (tweet == null) {
                    const result = null;
                    return result;
                }

                tweets.push(tweet);
            }

            const result = new Paginated<Tweet>({
                page: tweets,
                nextToken: paginated?.nextToken,
            });
            return result;
        }

        const result = null;
        return result;
    }
}