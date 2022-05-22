import { StreamAssistant } from "../../assistants/stream/stream";
import { Tweet, ViewableTweet } from "../core/models";
import { Paginated, PaginationParameters } from "../core/types";
import { TweetsManager } from "../tweetsManager/tweetsManager";

export class TimelinesManager {
    static readonly shared = new TimelinesManager();

    private constructor() { }

    async timeline(parameters: {
        userId: String
    } & PaginationParameters): Promise<Paginated<ViewableTweet> | null> {
        const activities = await StreamAssistant.shared.timelineFeed.activities({
            userId: parameters.userId,
            nextToken: parameters.nextToken,
            limit: parameters.limit,
        });

        if (activities !== null) {
            let tweets: ViewableTweet[] = [];

            for (let activity of activities.page) {
                const tweet = await TweetsManager.shared.tweet({
                    tweetId: activity.tweetId,
                    viewerId: parameters.userId
                });

                if (tweet !== null) {
                    tweets.push(tweet as ViewableTweet);
                } else {
                    return null;
                }
            }

            const reply: Paginated<ViewableTweet> = {
                page: tweets,
                nextToken: activities.nextToken
            };

            return reply;
        }

        return null;
    }
}