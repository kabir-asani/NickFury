import { TimelineTweetActivitiesFailureReason } from "../../assistants/stream/feeds/timelineFeed/types";
import StreamAssistant from "../../assistants/stream/stream";
import {
    Failure,
    Success,
    valuesOf,
} from "../../utils/typescriptx/typescriptx";
import { ViewableTweet } from "../core/models";
import { Paginated, PaginationParameters } from "../core/types";
import TweetsManager from "../tweetsManager/tweetsManager";
import { TimelineFailureReason } from "./types";

export default class TimelinesManager {
    static readonly shared = new TimelinesManager();

    private constructor() {}

    async timeline(
        parameters: {
            userId: String;
        } & PaginationParameters
    ): Promise<
        Success<Paginated<ViewableTweet>> | Failure<TimelineFailureReason>
    > {
        const tweetActivitiesResult =
            await StreamAssistant.shared.timelineFeed.activities({
                userId: parameters.userId,
                nextToken: parameters.nextToken,
                limit: parameters.limit,
            });

        if (tweetActivitiesResult instanceof Failure) {
            switch (tweetActivitiesResult.reason) {
                case TimelineTweetActivitiesFailureReason.malformedParameters: {
                    const reply = new Failure<TimelineFailureReason>(
                        TimelineFailureReason.malformedParameters
                    );

                    return reply;
                }
                default: {
                    const reply = new Failure<TimelineFailureReason>(
                        TimelineFailureReason.malformedParameters
                    );

                    return reply;
                }
            }
        }

        const tweetActivities = tweetActivitiesResult.data;

        const viewableTweetsResult = await TweetsManager.shared.viewableTweets({
            tweetIdentifiers: tweetActivities.page.map((tweetActivity) => {
                return tweetActivity.tweetId;
            }),
            viewerId: parameters.userId,
        });

        if (viewableTweetsResult instanceof Failure) {
            const reply = new Failure<TimelineFailureReason>(
                TimelineFailureReason.malformedParameters
            );

            return reply;
        }

        const viewableTweets = viewableTweetsResult.data;

        const paginatedTweets: Paginated<ViewableTweet> = {
            page: valuesOf(viewableTweets),
            nextToken: tweetActivities.nextToken,
        };

        const reply = new Success<Paginated<ViewableTweet>>(paginatedTweets);

        return reply;
    }
}
