import * as uuid from "uuid";
import { DatabaseAssistant, DatabaseCollections } from "../../assistants/database/database";
import { StreamAssistant } from "../../assistants/stream/stream";
import { Dately } from "../../utils/dately/dately";
import { Empty, Failure, Success } from "../../utils/typescriptx/typescriptx";
import { BookmarksManager } from "../bookmarksManager/bookmarksManager";
import { Tweet, TweetViewables, User, ViewableTweet, ViewableUser } from "../core/models";
import { Paginated, PaginationParameters, ViewablesParameters, ViewablesParameters2 } from "../core/types";
import { UsersManager } from "../usersManager/usersManager";
import { TweetCreationFailureReason, TweetDeletionFailureReason } from "./types";

export class TweetsManager {
    static readonly shared = new TweetsManager();

    private constructor() { }

    async exists(parameters: {
        tweetId: String;
    }): Promise<Boolean> {
        const tweetsCollection = DatabaseAssistant.shared.collection(DatabaseCollections.tweets);
        const tweetDocumentRef = tweetsCollection.doc(parameters.tweetId.valueOf());

        const tweetDocument = await tweetDocumentRef.get();

        if (tweetDocument.exists) {
            return true;
        } else {
            return false;
        }
    }

    async create(parameters: {
        authorId: String;
        tweet: {
            text: String;
        }
    }): Promise<Success<Tweet> | Failure<TweetCreationFailureReason>> {
        const tweetActivityAddition = await StreamAssistant.shared.selfFeed.addTweetActivity({
            authorId: parameters.authorId,
            externalTweetId: uuid.v4()
        });

        if (tweetActivityAddition instanceof Failure) {
            const reply = new Failure<TweetCreationFailureReason>(
                TweetCreationFailureReason.unknown
            );

            return reply;
        }

        const tweet: Tweet = {
            id: tweetActivityAddition.data.tweetId,
            externalId: tweetActivityAddition.data.externalTweetId,
            authorId: tweetActivityAddition.data.authorId,
            text: parameters.tweet.text,
            creationDate: Dately.shared.now(),
            lastUpdatedDate: Dately.shared.now(),
            interactionDetails: {
                commentsCount: 0,
                likesCount: 0
            }
        };

        const tweetsCollection = DatabaseAssistant.shared.collection(DatabaseCollections.tweets);
        const tweetDocumentRef = tweetsCollection.doc(tweetActivityAddition.data.tweetId.valueOf());

        try {
            await tweetDocumentRef.create(tweet);

            const reply = new Success<Tweet>(tweet);

            return reply;
        } catch {
            const reply = new Failure<TweetCreationFailureReason>(
                TweetCreationFailureReason.unknown
            );

            return reply;
        }
    }

    async delete(parameters: {
        tweetId: String;
    }): Promise<Success<Empty> | Failure<TweetDeletionFailureReason>> {
        const tweetsCollection = DatabaseAssistant.shared.collection(DatabaseCollections.tweets);
        const tweetDocumentRef = tweetsCollection.doc(parameters.tweetId.valueOf());

        const tweetDocument = await tweetDocumentRef.get();

        if (tweetDocument.exists) {
            const tweet = tweetDocument.data() as unknown as Tweet;

            const tweetActivityRemoval = await StreamAssistant.shared.selfFeed.removeTweetActivity({
                tweetId: tweet.id,
                authorId: tweet.authorId
            });

            if (tweetActivityRemoval instanceof Failure) {
                const reply = new Failure<TweetDeletionFailureReason>(TweetDeletionFailureReason.unknown);
                return reply;
            } else {
                try {
                    const usersCollection = DatabaseAssistant.shared.collection(DatabaseCollections.users);
                    const userDocumentRef = usersCollection.doc(tweet.authorId.valueOf());

                    await DatabaseAssistant.shared.runTransaction(async (transaction) => {
                        const userDocument = await userDocumentRef.get();

                        const user = userDocument.data() as unknown as User;

                        transaction.update(userDocumentRef, {
                            "activityDetails.tweetsCount": Math.max(
                                user.activityDetails.tweetsCount.valueOf() - 1,
                                0
                            )
                        });

                        transaction.delete(tweetDocumentRef);
                    });

                    const reply = new Success<Empty>({});
                    return reply;
                } catch {
                    const reply = new Failure<TweetDeletionFailureReason>(TweetDeletionFailureReason.unknown);
                    return reply;
                }
            }
        } else {

            const reply = new Failure<TweetDeletionFailureReason>(TweetDeletionFailureReason.tweetWithThatIdDoesNotExists);
            return reply;
        }
    }

    async tweet(parameters: {
        tweetId: String;
    } & ViewablesParameters): Promise<Tweet | null> {
        const tweetsCollection = DatabaseAssistant.shared.collection(DatabaseCollections.tweets);
        const tweetDocumentRef = tweetsCollection.doc(parameters.tweetId.valueOf());

        try {
            const tweetDocument = await tweetDocumentRef.get();

            if (tweetDocument.exists) {
                const tweet = tweetDocument.data() as unknown as Tweet;

                return tweet;
            } else {
                return null;
            }
        } catch {
            return null;
        }
    }

    async viewableTweet(parameters: {
        tweetId: String;
    } & ViewablesParameters2): Promise<ViewableTweet | null> {
        const tweetsCollection = DatabaseAssistant.shared.collection(DatabaseCollections.tweets);
        const tweetDocumentRef = tweetsCollection.doc(parameters.tweetId.valueOf());

        try {
            const tweetDocument = await tweetDocumentRef.get();

            if (tweetDocument.exists) {
                const tweet = tweetDocument.data() as unknown as Tweet;

                const viewables = await this.viewables({
                    tweetId: tweet.id,
                    authorId: tweet.authorId,
                    viewerId: parameters.viewerId
                });

                if (viewables !== null) {
                    const viewableTweet: ViewableTweet = {
                        ...tweet,
                        viewables: viewables
                    };

                    return viewableTweet;
                } else {
                    return null;
                }
            } else {
                return null;
            }
        } catch {
            return null;
        }
    }

    async tweets(parameters: {
        userId: String;
    } & PaginationParameters): Promise<Paginated<Tweet> | null> {
        const tweetActivities = await StreamAssistant.shared.selfFeed.activities({
            authorId: parameters.userId,
            limit: parameters.limit,
            nextToken: parameters.nextToken
        });

        if (tweetActivities === null) {
            return null;
        }

        const tweetDocumentRefs = tweetActivities.page.map((tweetActivity) => {
            const tweetsCollection = DatabaseAssistant.shared.collection(DatabaseCollections.tweets);
            const tweetDocumentRef = tweetsCollection.doc(tweetActivity.tweetId.valueOf());

            return tweetDocumentRef;
        });

        const tweetDocuments = await DatabaseAssistant.shared.getAll(...tweetDocumentRefs);


        const tweets = tweetDocuments.map((tweetDocument) => {
            const tweet = tweetDocument.data() as unknown as Tweet;

            return tweet;
        });

        const reply: Paginated<Tweet> = {
            page: tweets as unknown as Tweet[],
            nextToken: tweetActivities.nextToken
        }

        return reply;
    }


    async tweetsByIds(parameters: {
        ids: String[];
    } & PaginationParameters): Promise<{ [key: string]: Tweet } | null> {
        const tweetDocumentRefs = parameters.ids.map((tweetId) => {
            const tweetsCollection = DatabaseAssistant.shared.collection(DatabaseCollections.tweets);
            const tweetDocumentRef = tweetsCollection.doc(tweetId.valueOf());

            return tweetDocumentRef;
        });

        const tweetDocuments = await DatabaseAssistant.shared.getAll(...tweetDocumentRefs);

        const tweets: { [key: string]: Tweet } = {};

        tweetDocuments.forEach((tweetDocument) => {
            const tweet = tweetDocument.data() as unknown as Tweet;

            tweets[tweet.id.valueOf()] = tweet;
        });

        return tweets;
    }


    async viewableTweets(parameters: {
        userId: String;
    } & ViewablesParameters2 & PaginationParameters): Promise<Paginated<ViewableTweet> | null> {
        const tweets = await this.tweets({
            userId: parameters.userId,
            limit: parameters.limit,
            nextToken: parameters.nextToken
        });

        if (tweets !== null) {
            if (tweets.page.length === 0) {
                const reply: Paginated<ViewableTweet> = {
                    page: []
                };

                return reply;
            } else {
                const viewableUsers = await UsersManager.shared.viewableUsersByIds({
                    ids: tweets.page.map((tweet) => { return tweet.authorId }),
                    viewerId: parameters.viewerId
                });

                if (viewableUsers !== null) {
                    const viewableTweets = tweets.page.map((tweet) => {
                        const tweetViewables: TweetViewables = {
                            author: viewableUsers[tweet.authorId.valueOf()],
                            bookmarked: false // TODO: Fix this
                        };

                        const viewableTweet: ViewableTweet = {
                            ...tweet,
                            viewables: tweetViewables
                        }

                        return viewableTweet;
                    });

                    const reply: Paginated<ViewableTweet> = {
                        page: viewableTweets,
                        nextToken: tweets.nextToken
                    }

                    return reply;
                } else {
                    return null;
                }
            }
        } else {
            return null;
        }
    }

    async viewableTweetsByIds(parameters: {
        ids: String[];
    } & ViewablesParameters2 & PaginationParameters): Promise<{ [key: string]: ViewableTweet } | null> {
        const tweets = await this.tweetsByIds({
            ids: parameters.ids
        });

        if (tweets !== null) {
            const viewableUsers = await UsersManager.shared.viewableUsersByIds({
                ids: Object.values(tweets).map((tweet) => { return tweet.authorId }),
                viewerId: parameters.viewerId
            });

            const bookmarkedStatuses = await BookmarksManager.shared.bookmarkedStatuses({
                authorId: parameters.viewerId,
                tweetIds: Object.values(tweets).map((tweet) => { return tweet.id }),
            });

            if (viewableUsers !== null) {
                const viewableTweets: { [key: string]: ViewableTweet } = {};

                Object.values(tweets).forEach((tweet) => {
                    const tweetViewables: TweetViewables = {
                        author: viewableUsers[tweet.authorId.valueOf()],
                        bookmarked: bookmarkedStatuses[tweet.id.valueOf()]
                    };

                    const viewableTweet: ViewableTweet = {
                        ...tweet,
                        viewables: tweetViewables
                    }

                    viewableTweets[viewableTweet.id.valueOf()] = viewableTweet;
                });

                return viewableTweets;
            } else {
                return null;
            }
        } else {
            return null;
        }
    }


    private async viewables(parameters: {
        tweetId: String;
        authorId: String;
        viewerId: String;
    }): Promise<TweetViewables | null> {
        const viewableAuthor = await UsersManager.shared.viewableUser({
            id: parameters.authorId,
            viewerId: parameters.viewerId
        });

        if (viewableAuthor === null) {
            return null;
        }

        const isBookmarked = await BookmarksManager.shared.existsByDetails({
            tweetId: parameters.tweetId,
            authorId: parameters.viewerId
        });

        const viewables: TweetViewables = {
            author: viewableAuthor as ViewableUser,
            bookmarked: isBookmarked
        };

        return viewables;
    }
}