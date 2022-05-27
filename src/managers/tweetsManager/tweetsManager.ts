import * as uuid from "uuid";
import {
    DatabaseAssistant,
    DBCollections,
} from "../../assistants/database/database";
import { TweetActivitiesFailureReason } from "../../assistants/stream/feeds/selfFeed/types";
import StreamAssistant from "../../assistants/stream/stream";
import Dately from "../../utils/dately/dately";
import logger, { LogLevel } from "../../utils/logger/logger";
import {
    Empty,
    Failure,
    Success,
    valuesOf,
} from "../../utils/typescriptx/typescriptx";
import BookmarksManager from "../bookmarksManager/bookmarksManager";
import {
    Tweet,
    TweetViewables,
    User,
    ViewableTweet,
    ViewableUser,
} from "../core/models";
import {
    Paginated,
    PaginationParameters,
    Value,
    ViewablesParameters,
} from "../core/types";
import UsersManager from "../usersManager/usersManager";
import {
    TweetCreationFailureReason,
    TweetDeletionFailureReason,
    PaginatedTweetsFailureReason,
    TweetsFailureReason,
    PaginatedViewableTweetsFailureReason,
    ViewableTweetsFailureReason,
} from "./types";

export default class TweetsManager {
    static readonly shared = new TweetsManager();

    private constructor() {}

    async exists(parameters: { tweetId: String }): Promise<Boolean> {
        const tweetDocumentPath =
            DBCollections.tweets + `/${parameters.tweetId}`;

        const tweetDocumentRef =
            DatabaseAssistant.shared.doc(tweetDocumentPath);

        const tweetDocument = await tweetDocumentRef.get();

        if (tweetDocument.exists) {
            return true;
        }

        return false;
    }

    async create(parameters: {
        authorId: String;
        data: {
            text: String;
        };
    }): Promise<Success<Tweet> | Failure<TweetCreationFailureReason>> {
        const tweetActivityAdditionResult =
            await StreamAssistant.shared.selfFeed.addTweetActivity({
                authorId: parameters.authorId,
                externalTweetId: uuid.v4(),
            });

        if (tweetActivityAdditionResult instanceof Failure) {
            const reply = new Failure<TweetCreationFailureReason>(
                TweetCreationFailureReason.unknown
            );

            return reply;
        }

        const tweetActivity = tweetActivityAdditionResult.data;

        const tweet: Tweet = {
            id: tweetActivity.tweetId,
            externalId: tweetActivity.externalTweetId,
            authorId: tweetActivity.authorId,
            text: parameters.data.text,
            creationDate: Dately.shared.now(),
            lastUpdatedDate: Dately.shared.now(),
            interactionDetails: {
                commentsCount: 0,
                likesCount: 0,
            },
        };

        try {
            const userDocumentPath = DBCollections.users + `/${tweet.authorId}`;
            const userDocumentRef =
                DatabaseAssistant.shared.doc(userDocumentPath);

            const tweetDocumentPath = DBCollections.tweets + `/${tweet.id}`;
            const tweetDocumentRef =
                DatabaseAssistant.shared.doc(tweetDocumentPath);

            await DatabaseAssistant.shared.runTransaction(
                async (transaction) => {
                    const userDocument = await userDocumentRef.get();

                    const user = userDocument.data() as unknown as User;

                    transaction.create(tweetDocumentRef, tweet);

                    transaction.update(userDocumentRef, {
                        "activityDetails.tweetsCount":
                            user.activityDetails.tweetsCount.valueOf() + 1,
                    });
                }
            );

            const reply = new Success<Tweet>(tweet);

            return reply;
        } catch (e) {
            logger(e, LogLevel.attention, [this, this.create]);

            const reply = new Failure<TweetCreationFailureReason>(
                TweetCreationFailureReason.unknown
            );

            return reply;
        }
    }

    async delete(parameters: {
        tweetId: String;
    }): Promise<Success<Empty> | Failure<TweetDeletionFailureReason>> {
        const tweet = await this.tweet({
            tweetId: parameters.tweetId,
        });

        if (tweet === null) {
            const reply = new Failure<TweetDeletionFailureReason>(
                TweetDeletionFailureReason.tweetWithThatIdDoesNotExists
            );

            return reply;
        }

        const tweetActivityRemovalResult =
            await StreamAssistant.shared.selfFeed.removeTweetActivity({
                tweetId: tweet.id,
                authorId: tweet.authorId,
            });

        if (tweetActivityRemovalResult instanceof Failure) {
            const reply = new Failure<TweetDeletionFailureReason>(
                TweetDeletionFailureReason.unknown
            );

            return reply;
        }

        try {
            const userDocumentPath = DBCollections.users + `/${tweet.authorId}`;
            const userDocumentRef =
                DatabaseAssistant.shared.doc(userDocumentPath);

            const tweetDocumentPath = DBCollections.tweets + `${tweet.id}`;
            const tweetDocumentRef =
                DatabaseAssistant.shared.doc(tweetDocumentPath);

            await DatabaseAssistant.shared.runTransaction(
                async (transaction) => {
                    const userDocument = await userDocumentRef.get();

                    const user = userDocument.data() as unknown as User;

                    transaction.update(userDocumentRef, {
                        "activityDetails.tweetsCount": Math.max(
                            user.activityDetails.tweetsCount.valueOf() - 1,
                            0
                        ),
                    });

                    transaction.delete(tweetDocumentRef);
                }
            );

            const reply = new Success<Empty>({});

            return reply;
        } catch (e) {
            logger(e, LogLevel.attention, [this, this.delete]);

            const reply = new Failure<TweetDeletionFailureReason>(
                TweetDeletionFailureReason.unknown
            );

            return reply;
        }
    }

    private async tweet(parameters: {
        tweetId: String;
    }): Promise<Tweet | null> {
        const tweetDocumentPath =
            DBCollections.tweets + `/${parameters.tweetId}`;

        const tweetDocumentRef =
            DatabaseAssistant.shared.doc(tweetDocumentPath);

        const tweetDocument = await tweetDocumentRef.get();

        if (tweetDocument.exists) {
            const tweet = tweetDocument.data() as unknown as Tweet;

            return tweet;
        }

        return null;
    }

    async viewableTweet(
        parameters: {
            tweetId: String;
        } & ViewablesParameters
    ): Promise<ViewableTweet | null> {
        const tweetsCollection = DatabaseAssistant.shared.collection(
            DBCollections.tweets
        );
        const tweetDocumentRef = tweetsCollection.doc(
            parameters.tweetId.valueOf()
        );

        const tweet = await this.tweet({
            tweetId: parameters.tweetId,
        });

        if (tweet === null) {
            return null;
        }

        const viewables = await this.tweetViewables({
            tweetId: tweet.id,
            authorId: tweet.authorId,
            viewerId: parameters.viewerId,
        });

        if (viewables !== null) {
            const viewableTweet: ViewableTweet = {
                ...tweet,
                viewables: viewables,
            };

            return viewableTweet;
        }

        return null;
    }

    private async tweetViewables(parameters: {
        tweetId: String;
        authorId: String;
        viewerId: String;
    }): Promise<TweetViewables | null> {
        const viewableAuthor = await UsersManager.shared.viewableUser({
            id: parameters.authorId,
            viewerId: parameters.viewerId,
        });

        if (viewableAuthor === null) {
            return null;
        }

        const isBookmarked = await BookmarksManager.shared.existsByDetails({
            tweetId: parameters.tweetId,
            authorId: parameters.viewerId,
        });

        const viewables: TweetViewables = {
            author: viewableAuthor as ViewableUser,
            bookmarked: isBookmarked,
        };

        return viewables;
    }

    private async paginatedTweetsOf(
        parameters: {
            userId: String;
        } & PaginationParameters
    ): Promise<
        Success<Paginated<Tweet>> | Failure<PaginatedTweetsFailureReason>
    > {
        const tweetActivitiesResult =
            await StreamAssistant.shared.selfFeed.activities({
                authorId: parameters.userId,
                limit: parameters.limit,
                nextToken: parameters.nextToken,
            });

        if (tweetActivitiesResult instanceof Failure) {
            switch (tweetActivitiesResult.reason) {
                case TweetActivitiesFailureReason.malformedParameters: {
                    const reply = new Failure<PaginatedTweetsFailureReason>(
                        PaginatedTweetsFailureReason.malformedParameters
                    );

                    return reply;
                }
                default: {
                    const reply = new Failure<PaginatedTweetsFailureReason>(
                        PaginatedTweetsFailureReason.unknown
                    );

                    return reply;
                }
            }
        }

        const tweetActivities = tweetActivitiesResult.data;

        if (tweetActivities.page.length === 0) {
            const paginatedTweets: Paginated<Tweet> = { page: [] };

            const reply = new Success<Paginated<Tweet>>(paginatedTweets);

            return reply;
        }

        const tweetDocumentRefs = tweetActivities.page.map((tweetActivity) => {
            const tweetsCollection = DatabaseAssistant.shared.collection(
                DBCollections.tweets
            );
            const tweetDocumentRef = tweetsCollection.doc(
                tweetActivity.tweetId.valueOf()
            );

            return tweetDocumentRef;
        });

        const tweetDocuments = await DatabaseAssistant.shared.getAll(
            ...tweetDocumentRefs
        );

        const tweets = tweetDocuments.map((tweetDocument) => {
            const tweet = tweetDocument.data() as unknown as Tweet;

            return tweet;
        });

        const paginatedTweets: Paginated<Tweet> = {
            page: tweets,
            nextToken: tweetActivities.nextToken,
        };

        const reply = new Success<Paginated<Tweet>>(paginatedTweets);

        return reply;
    }

    async paginatedViewableTweetsOf(
        parameters: {
            userId: String;
        } & ViewablesParameters &
            PaginationParameters
    ): Promise<
        | Success<Paginated<ViewableTweet>>
        | Failure<PaginatedViewableTweetsFailureReason>
    > {
        const paginatedTweetsResult = await this.paginatedTweetsOf({
            userId: parameters.userId,
            limit: parameters.limit,
            nextToken: parameters.nextToken,
        });

        if (paginatedTweetsResult instanceof Failure) {
            switch (paginatedTweetsResult.reason) {
                case PaginatedTweetsFailureReason.malformedParameters: {
                    const reply =
                        new Failure<PaginatedViewableTweetsFailureReason>(
                            PaginatedViewableTweetsFailureReason.malformedParameters
                        );

                    return reply;
                }
                default: {
                    const reply =
                        new Failure<PaginatedViewableTweetsFailureReason>(
                            PaginatedViewableTweetsFailureReason.unknown
                        );

                    return reply;
                }
            }
        }

        const paginatedTweets = paginatedTweetsResult.data;

        if (paginatedTweets.page.length === 0) {
            const paginatedViewableTweets: Paginated<ViewableTweet> = {
                page: [],
            };

            const reply = new Success<Paginated<ViewableTweet>>(
                paginatedViewableTweets
            );

            return reply;
        }

        const viewableUsersResult = await UsersManager.shared.viewableUsers({
            userIdentifiers: paginatedTweets.page.map((tweet) => {
                return tweet.authorId;
            }),
            viewerId: parameters.viewerId,
        });

        if (viewableUsersResult instanceof Failure) {
            const reply = new Failure<PaginatedViewableTweetsFailureReason>(
                PaginatedViewableTweetsFailureReason.unknown
            );

            return reply;
        }

        const viewableUsers = viewableUsersResult.data;

        const bookmarkedStatuses =
            await BookmarksManager.shared.bookmarkStatuses({
                authorId: parameters.viewerId,
                tweetIds: paginatedTweets.page.map((tweet) => {
                    return tweet.id;
                }),
            });

        const viewableTweets = paginatedTweets.page.map((tweet) => {
            const tweetViewables: TweetViewables = {
                author: viewableUsers[tweet.authorId.valueOf()],
                bookmarked: bookmarkedStatuses[tweet.id.valueOf()],
            };

            const viewableTweet: ViewableTweet = {
                ...tweet,
                viewables: tweetViewables,
            };

            return viewableTweet;
        });

        const paginatedViewableTweets: Paginated<ViewableTweet> = {
            page: viewableTweets,
            nextToken: paginatedTweets.nextToken,
        };

        const reply = new Success<Paginated<ViewableTweet>>(
            paginatedViewableTweets
        );

        return reply;
    }

    private async tweets(parameters: {
        tweetIdentifiers: String[];
    }): Promise<Success<Value<Tweet>> | Failure<TweetsFailureReason>> {
        if (parameters.tweetIdentifiers.length === 0) {
            const reply = new Success<Value<Tweet>>({});

            return reply;
        }

        const tweetDocumentRefs = parameters.tweetIdentifiers.map((tweetId) => {
            const tweetDocumentPath = DBCollections.tweets + `/${tweetId}`;

            const tweetDocumentRef =
                DatabaseAssistant.shared.doc(tweetDocumentPath);

            return tweetDocumentRef;
        });

        const tweetDocuments = await DatabaseAssistant.shared.getAll(
            ...tweetDocumentRefs
        );

        const tweets: Value<Tweet> = {};

        for (let tweetDocument of tweetDocuments) {
            if (!tweetDocument.exists) {
                const reply = new Failure<TweetsFailureReason>(
                    TweetsFailureReason.missingTweets
                );

                return reply;
            }

            const tweet = tweetDocument.data() as unknown as Tweet;

            tweets[tweet.id.valueOf()] = tweet;
        }

        const reply = new Success<Value<Tweet>>(tweets);

        return reply;
    }

    async viewableTweets(
        parameters: {
            tweetIdentifiers: String[];
        } & ViewablesParameters
    ): Promise<
        Success<Value<ViewableTweet>> | Failure<ViewableTweetsFailureReason>
    > {
        if (parameters.tweetIdentifiers.length === 0) {
            const reply = new Success<Value<ViewableTweet>>({});

            return reply;
        }

        const tweetsResult = await this.tweets({
            tweetIdentifiers: parameters.tweetIdentifiers,
        });

        if (tweetsResult instanceof Failure) {
            switch (tweetsResult.reason) {
                case TweetsFailureReason.missingTweets: {
                    const reply = new Failure<ViewableTweetsFailureReason>(
                        ViewableTweetsFailureReason.missingTweets
                    );

                    return reply;
                }
                default: {
                    const reply = new Failure<ViewableTweetsFailureReason>(
                        ViewableTweetsFailureReason.unknown
                    );

                    return reply;
                }
            }
        }

        const viewableUsersResult = await UsersManager.shared.viewableUsers({
            userIdentifiers: valuesOf(tweetsResult).map((tweet) => {
                return tweet.authorId;
            }),
            viewerId: parameters.viewerId,
        });

        if (viewableUsersResult instanceof Failure) {
            const reply = new Failure<ViewableTweetsFailureReason>(
                ViewableTweetsFailureReason.unknown
            );

            return reply;
        }

        const viewableUsers = viewableUsersResult.data;

        const bookmarkedStatuses =
            await BookmarksManager.shared.bookmarkStatuses({
                authorId: parameters.viewerId,
                tweetIds: valuesOf(tweetsResult).map((tweet) => {
                    return tweet.id;
                }),
            });

        const viewableTweets: Value<ViewableTweet> = {};

        valuesOf(tweetsResult).forEach((tweet) => {
            const tweetViewables: TweetViewables = {
                author: viewableUsers[tweet.authorId.valueOf()],
                bookmarked: bookmarkedStatuses[tweet.id.valueOf()],
            };

            const viewableTweet: ViewableTweet = {
                ...tweet,
                viewables: tweetViewables,
            };

            viewableTweets[viewableTweet.id.valueOf()] = viewableTweet;
        });

        const reply = new Success<Value<ViewableTweet>>(viewableTweets);

        return reply;
    }
}
