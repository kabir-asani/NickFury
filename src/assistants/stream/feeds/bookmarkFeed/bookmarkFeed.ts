import { FlatActivity, StreamClient } from "getstream";
import { Paginated, PaginationQuery } from "../../../../managers/core/types";
import { Empty, Failure, Success } from "../../../../utils/typescriptx/typescriptx";
import { FeedAssistant } from "../feed";
import { SelfFeedAssistant } from "../selfFeed/selfFeed";
import { BookmarkActivity } from "../types";
import { AddBookmarkActivityFailure, RemoveBookmarkActivityFailure } from "./types";

export class BookmarkFeedAssistant extends FeedAssistant {
    public static readonly feed = "bookmark";
    private static readonly verb = "bookmark";

    constructor(parameters: {
        client: StreamClient;
    }) {
        super({
            type: SelfFeedAssistant.feed,
            client: parameters.client
        });
    }

    async addBookmarkActivity(parameters: {
        authorId: String;
        tweetId: String;
    }): Promise<Success<BookmarkActivity> | Failure<AddBookmarkActivityFailure>> {
        const feed = this.client.feed(
            this.type.valueOf(),
            parameters.authorId.valueOf(),
        );

        try {
            const bookmarkActivity = await feed.addActivity({
                actor: parameters.authorId.valueOf(),
                verb: BookmarkFeedAssistant.verb,
                object: parameters.tweetId.valueOf(),
            });

            const result = new Success<BookmarkActivity>({
                bookmarkId: bookmarkActivity.id,
                authorId: parameters.authorId,
                tweetId: parameters.tweetId
            });

            return result;
        } catch {
            const result = new Failure<AddBookmarkActivityFailure>(
                AddBookmarkActivityFailure.UNKNOWN
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
            parameters.authorId.valueOf(),
        );

        try {
            await feed.removeActivity(parameters.bookmarkId.valueOf());

            const result = new Success<Empty>({});
            return result;
        } catch {
            const result = new Failure<RemoveBookmarkActivityFailure>(
                RemoveBookmarkActivityFailure.UNKNOWN
            );

            return result;
        }
    }

    async activities(parameters: {
        authorId: String;
    } & PaginationQuery): Promise<Paginated<BookmarkActivity> | null> {
        const feed = this.client.feed(
            this.type.valueOf(),
            parameters.authorId.valueOf(),
        );

        try {
            const flatFeed = await feed.get({
                id_gt: parameters.nextToken?.valueOf(),
                limit: Math.min(
                    parameters.limit?.valueOf() || Paginated.maximumPageLength,
                    Paginated.maximumPageLength,
                ),
            });

            const flatActivities = flatFeed.results as FlatActivity[];

            const bookmarkActivities = flatActivities
                .map((activity) => {
                    const bookmarkActivity: BookmarkActivity = {
                        bookmarkId: activity.id as String,
                        authorId: activity.actor as String,
                        tweetId: activity.object as String,
                    };

                    return bookmarkActivity;
                });

            const result = new Paginated<BookmarkActivity>({
                page: bookmarkActivities,
                nextToken: flatFeed.next,
            });

            return result;
        } catch {
            const result = null;

            return result;
        }
    }
}