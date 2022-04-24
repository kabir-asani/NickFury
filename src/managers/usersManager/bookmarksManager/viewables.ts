import { Failure, Success } from "../../../utils/typescriptx/typescriptx";
import { TweetsManager } from "../../tweetsManager/tweetsManager";
import { ViewableTweetX } from "../../tweetsManager/viewables";
import { UsersManager } from "../../usersManager/usersManager";
import { ViewableUserX } from "../../usersManager/viewables";
import { Bookmark, ViewableBookmark } from "./models";
import { ViewableBookmarkFailure } from "./types";

class ViewableBookmarkX {
    private bookmark: Bookmark;

    constructor(parameters: {
        bookmark: Bookmark;
    }) {
        this.bookmark = parameters.bookmark;
    }

    async viewable(parameters: {
        viewerId: String;
        options?: {
            enableViewerCheck?: Boolean;
        };
    }): Promise<Success<ViewableBookmark> | Failure<ViewableBookmarkFailure>> {
        if (parameters.options?.enableViewerCheck === true) {
            const isViewerExists = await UsersManager.shared.exists({
                userId: parameters.viewerId
            });

            if (!isViewerExists) {
                const result = new Failure<ViewableBookmarkFailure>(ViewableBookmarkFailure.VIEWER_DOES_NOT_EXISTS);
                return result;
            }
        }

        const tweetResult = await TweetsManager.shared.tweet({
            tweetId: this.bookmark.tweetId
        });

        if (tweetResult instanceof Failure) {
            switch (tweetResult.reason) {
                default: {
                    const result = new Failure<ViewableBookmarkFailure>(ViewableBookmarkFailure.UNKNOWN);
                    return result;
                }
            }
        }


        const tweet = tweetResult.data;
        const viewableTweetX = new ViewableTweetX({
            tweet: tweet
        });

        const viewableTweetResult = await viewableTweetX.viewable({
            viewerId: parameters.viewerId
        });

        if (viewableTweetResult instanceof Failure) {
            switch (viewableTweetResult.reason) {
                default: {
                    const result = new Failure<ViewableBookmarkFailure>(ViewableBookmarkFailure.UNKNOWN);
                    return result;
                }
            }
        }

        const viewableTweet = viewableTweetResult.data;

        const viewableBookmark: ViewableBookmark = {
            ...this.bookmark,
            tweet: viewableTweet
        };

        const result = new Success<ViewableBookmark>(viewableBookmark);
        return result;
    }
}

class ViewableBookmarksX {
    private bookmarks: Bookmark[];

    constructor(parameters: {
        bookmarks: Bookmark[];
    }) {
        this.bookmarks = parameters.bookmarks;
    }

    async viewable(parameters: {
        viewerId: String;
        options?: {
            enableViewerCheck?: Boolean;
        };
    }): Promise<Success<ViewableBookmark[]> | Failure<ViewableBookmarkFailure>> {
        if (parameters.options?.enableViewerCheck === true) {
            const isViewerExists = await UsersManager.shared.exists({
                userId: parameters.viewerId
            });

            if (!isViewerExists) {
                const result = new Failure<ViewableBookmarkFailure>(ViewableBookmarkFailure.VIEWER_DOES_NOT_EXISTS);
                return result;
            }
        }

        const viewableBookmarks: ViewableBookmark[] = [];

        for (const bookmark of this.bookmarks) {
            const viewableBookmarkX = new ViewableBookmarkX({
                bookmark: bookmark
            });

            const viewableBookmarkResult = await viewableBookmarkX.viewable({
                viewerId: parameters.viewerId,
            });

            if (viewableBookmarkResult instanceof Failure) {
                return viewableBookmarkResult;
            }

            const viewableBoookmark = viewableBookmarkResult.data;
            viewableBookmarks.push(viewableBoookmark);
        }

        const result = new Success<ViewableBookmark[]>(viewableBookmarks);
        return result;
    }
}