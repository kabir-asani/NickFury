import * as uuid from "uuid";
import { DatabaseAssistant, DatabaseCollections } from "../../assistants/database/database";
import { StreamAssistant } from "../../assistants/stream/stream";
import { Dately } from "../../utils/dately/dately";
import { Empty, Failure, Success } from "../../utils/typescriptx/typescriptx";
import { BookmarksManager } from "../bookmarksManager/bookmarksManager";
import { Tweet, TweetViewables, User, ViewableTweet, ViewableUser } from "../core/models";
import { Paginated, PaginationParameters, ViewablesParameters } from "../core/types";
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
    } & ViewablesParameters): Promise<Tweet | ViewableTweet | null> {
        const tweetsCollection = DatabaseAssistant.shared.collection(DatabaseCollections.tweets);
        const tweetDocumentRef = tweetsCollection.doc(parameters.tweetId.valueOf());

        try {
            const tweetDocument = await tweetDocumentRef.get();

            if (tweetDocument.exists) {
                const tweet = tweetDocument.data() as unknown as Tweet;

                if (parameters.viewerId !== undefined) {
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
                    return tweet;
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
    } & ViewablesParameters & PaginationParameters): Promise<Paginated<Tweet | ViewableTweet> | null> {
        const tweetActivities = await StreamAssistant.shared.selfFeed.activities({
            authorId: parameters.userId,
            limit: parameters.limit,
            nextToken: parameters.nextToken
        });

        if (tweetActivities === null) {
            return null;
        }

        const tweets = [];

        for (let tweetActivity of tweetActivities.page) {
            const tweet = await this.tweet({
                tweetId: tweetActivity.tweetId,
                viewerId: parameters.viewerId
            });

            if (tweet !== null) {
                tweets.push(tweet);
            } else {
                return null;
            }
        }

        if (parameters.viewerId !== undefined) {
            const reply: Paginated<ViewableTweet> = {
                page: tweets as unknown as ViewableTweet[],
                nextToken: tweetActivities.nextToken
            }

            return reply;
        } else {
            const reply: Paginated<Tweet> = {
                page: tweets as unknown as Tweet[],
                nextToken: tweetActivities.nextToken
            }

            return reply;
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

        const isBookmarked = await BookmarksManager.shared.exists({
            bookmarkDetails: {
                tweetId: parameters.tweetId,
                authorId: parameters.viewerId
            }
        });

        const viewables: TweetViewables = {
            author: viewableAuthor as ViewableUser,
            bookmarked: isBookmarked
        };

        return viewables;
    }
}