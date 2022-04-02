import { FlatActivity, StreamClient } from "getstream";
import { Paginated } from "../../../../managers/core/types";
import { Empty, Failure, Success } from "../../../../utils/typescriptx/typescriptx";
import { FeedAssistant } from "../feed";
import { UserFeedAssistant } from "../userFeed/userFeed";
import { PartialBookmark } from "../types";
import { AddBookmarkActivityFailure, BookmarkActivity, RemoveBookmarkActivityFailure } from "./types";

export class BookmarkFeedAssistant extends FeedAssistant {
    static readonly feed = "bookmark";
    private static readonly verb = "bookmark";

    constructor(parameters: {
        client: StreamClient;
    }) {
        super({
            type: UserFeedAssistant.feed,
            client: parameters.client
        });
    }

    async createBookmarkActivity(parameters: {
        authorId: String;
        tweetId: String;
    }): Promise<Success<BookmarkActivity> | Failure<AddBookmarkActivityFailure>> {
        const feed = this.client.feed(
            this.type.valueOf(),
            parameters.authorId.valueOf(),
        );

        try {
            const activity = await feed.addActivity({
                actor: parameters.authorId.valueOf(),
                verb: BookmarkFeedAssistant.verb,
                object: parameters.tweetId.valueOf(),
            });

            const result = new Success<BookmarkActivity>({
                id: activity.id
            });
            return result;
        } catch {
            const result = new Failure<AddBookmarkActivityFailure>(AddBookmarkActivityFailure.UNKNOWN);
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
            feed.removeActivity(parameters.bookmarkId.valueOf());

            const result = new Success<Empty>({});
            return result;
        } catch {
            const result = new Failure<RemoveBookmarkActivityFailure>(RemoveBookmarkActivityFailure.UNKNOWN);
            return result;
        }
    }

    async bookmarks(parameters: {
        authorId: String;
        limit?: Number;
        nextToken?: String;
    }): Promise<Paginated<PartialBookmark> | null> {
        const feed = this.client.feed(
            this.type.valueOf(),
            parameters.authorId.valueOf(),
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

            const partialBookmarks = activities
                .map((activity) => {
                    const partialBookmark: PartialBookmark = new PartialBookmark({
                        bookmarkId: activity.id as String,
                        authorId: activity.actor as String,
                        tweetId: activity.object as String,
                    });

                    return partialBookmark;
                });

            const result = new Paginated<PartialBookmark>({
                page: partialBookmarks,
                nextToken:
                    flatPaginatedFeed.next !== undefined || flatPaginatedFeed.next !== null
                        ? partialBookmarks[partialBookmarks.length - 1].tweetId
                        : undefined,
            });
            return result;
        } catch {
            const result = null;
            return result;
        }
    }
}