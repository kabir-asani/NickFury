import { FlatActivity, StreamApiError, StreamClient } from "getstream";
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
import { BookmarkActivity } from "../types";
import {
    AddBookmarkActivityFailure,
    BookmarkActivitiesFailureReason,
    RemoveBookmarkActivityFailure,
} from "./types";

export default class BookmarkFeedAssistant extends FeedAssistant {
    static readonly feed = "bookmark";
    static readonly verb = "bookmark";

    constructor(parameters: { client: StreamClient }) {
        super({
            type: BookmarkFeedAssistant.feed,
            client: parameters.client,
        });
    }

    async addBookmarkActivity(parameters: {
        authorId: String;
        tweetId: String;
    }): Promise<
        Success<BookmarkActivity> | Failure<AddBookmarkActivityFailure>
    > {
        const feed = this.client.feed(
            this.type.valueOf(),
            parameters.authorId.valueOf()
        );

        try {
            const feedActivityDetails = {
                actor: parameters.authorId.valueOf(),
                verb: BookmarkFeedAssistant.verb,
                object: parameters.tweetId.valueOf(),
            };

            const feedActivity = await feed.addActivity(feedActivityDetails);

            const bookmarkActivity: BookmarkActivity = {
                bookmarkId: feedActivity.id,
                authorId: parameters.authorId,
                tweetId: parameters.tweetId,
            };

            const result = new Success<BookmarkActivity>(bookmarkActivity);

            return result;
        } catch (e) {
            logger(e, LogLevel.attention, [this, this.removeBookmarkActivity]);

            const result = new Failure<AddBookmarkActivityFailure>(
                AddBookmarkActivityFailure.unknown
            );

            return result;
        }
    }

    async removeBookmarkActivity(parameters: {
        authorId: String;
        bookmarkId: String;
    }): Promise<Success<Empty> | Failure<RemoveBookmarkActivityFailure>> {
        const feed = this.client.feed(
            this.type.valueOf(),
            parameters.authorId.valueOf()
        );

        try {
            await feed.removeActivity(parameters.bookmarkId.valueOf());

            const result = new Success<Empty>({});
            return result;
        } catch (e) {
            logger(e, LogLevel.attention, [this, this.removeBookmarkActivity]);

            const result = new Failure<RemoveBookmarkActivityFailure>(
                RemoveBookmarkActivityFailure.unknown
            );

            return result;
        }
    }

    async activities(
        parameters: {
            authorId: String;
        } & PaginationParameters
    ): Promise<
        | Success<Paginated<BookmarkActivity>>
        | Failure<BookmarkActivitiesFailureReason>
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

            const bookmarkActivities = flatActivities.map((feedActivity) => {
                const bookmarkActivity: BookmarkActivity = {
                    bookmarkId: feedActivity.id as String,
                    authorId: feedActivity.actor as String,
                    tweetId: feedActivity.object as unknown as String,
                };

                return bookmarkActivity;
            });

            const paginatedBookmarks: Paginated<BookmarkActivity> = {
                page: bookmarkActivities,
                nextToken: flatFeed.next || undefined,
            };

            const reply = new Success<Paginated<BookmarkActivity>>(
                paginatedBookmarks
            );

            return reply;
        } catch (e) {
            logger(e, LogLevel.attention);

            if (e instanceof StreamApiError) {
                if (e.response.status === 400) {
                    const reply = new Failure<BookmarkActivitiesFailureReason>(
                        BookmarkActivitiesFailureReason.malformedParameters
                    );

                    return reply;
                }
            }

            const reply = new Failure<BookmarkActivitiesFailureReason>(
                BookmarkActivitiesFailureReason.unknown
            );

            return reply;
        }
    }
}
