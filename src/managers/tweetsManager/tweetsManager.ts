import * as uuid from 'uuid';

import { DatabaseAssistant } from "../../assistants/database/database";
import { StreamAssistant } from '../../assistants/stream/stream';
import { Dately } from '../../utils/dately/dately';
import { Empty, Failure, Success } from '../../utils/typescriptx/typescriptx';
import { TxDatabaseCollections } from "../core/collections";
import { Paginated, PaginationQuery } from '../core/types';
import { User } from '../usersManager/models';
import { UsersManager } from '../usersManager/usersManager';
import { Tweet } from "./models";
import {
    CreateTweetFailure,
    DeleteTweetFailure,
    TweetsFeedFailure,
    TweetFailure,
} from "./types";

export class TweetsManager {
    public static readonly shared = new TweetsManager();

    private constructor() { }

    async exits(parameters: {
        tweetId: String,
    }): Promise<Boolean> {
        const tweetsCollectionRef = DatabaseAssistant.shared.collection(TxDatabaseCollections.tweets);
        const tweetDocumentRef = tweetsCollectionRef.doc(parameters.tweetId.valueOf());

        try {
            const tweetDocument = await tweetDocumentRef.get();

            if (tweetDocument.exists) {
                return true;
            } else {
                return false;
            }
        } catch {
            return false;
        }
    }

    async createTweet(parameters: {
        tweetData: {
            text: String;
        };
        authorId: String;
    }): Promise<Success<Tweet> | Failure<CreateTweetFailure>> {
        if (parameters.tweetData.text.length <= 0 || parameters.tweetData.text.length > 280) {
            const result = new Failure<CreateTweetFailure>(CreateTweetFailure.MALFORMED_TWEET);
            return result;
        }

        const isAuthorExists = await UsersManager.shared.exists({
            userId: parameters.authorId
        });

        if (!isAuthorExists) {
            const result = new Failure<CreateTweetFailure>(CreateTweetFailure.AUTHOR_DOES_NOT_EXISTS);
            return result;
        }

        const complimentaryTweetId = uuid.v4();

        const createTweetActivityResult = await StreamAssistant.shared.userFeed.addTweetActivity({
            authorId: parameters.authorId,
            complimentaryTweetId: complimentaryTweetId,
        });

        if (createTweetActivityResult instanceof Failure) {
            const result = new Failure<CreateTweetFailure>(CreateTweetFailure.UNKNOWN);
            return result;
        }

        const tweet: Tweet = {
            id: createTweetActivityResult.data.tweetId,
            complimentaryTweetId: complimentaryTweetId,
            text: parameters.tweetData.text,
            creationDate: Dately.shared.now(),
            authorId: parameters.authorId.valueOf(),
            meta: {
                likesCount: 0,
                commentsCount: 0
            },
        };

        try {
            await DatabaseAssistant.shared.runTransaction(async (transaction) => {
                // References
                const usersCollectionRef = DatabaseAssistant.shared.collection(TxDatabaseCollections.users);
                const userDocumentRef = usersCollectionRef.doc(parameters.authorId.valueOf());

                const tweetsCollectionRef = DatabaseAssistant.shared.collection(TxDatabaseCollections.tweets);
                const tweetDocumentRef = tweetsCollectionRef.doc(tweet.id.valueOf());

                const userDocument = await userDocumentRef.get();
                const user = userDocument.data() as unknown as User;

                // Action
                transaction.create(
                    tweetDocumentRef,
                    tweet,
                );
                transaction.update(
                    userDocumentRef,
                    { "activityDetails.tweetsCount": user.activityDetails.tweetsCount.valueOf() + 1 },
                );
            });

            const result = new Success<Tweet>(tweet);
            return result;
        } catch {
            const result = new Failure<CreateTweetFailure>(CreateTweetFailure.UNKNOWN);
            return result;
        }
    }

    async tweet(parameters: {
        tweetId: String;
    }): Promise<Success<Tweet> | Failure<TweetFailure>> {
        // References
        const tweetsCollectionRef = DatabaseAssistant.shared.collection(TxDatabaseCollections.tweets);
        const tweetDocumentRef = tweetsCollectionRef.doc(parameters.tweetId.valueOf());

        // Action
        try {
            const tweetDocument = await tweetDocumentRef.get();

            if (!tweetDocument.exists) {
                const result = new Failure<TweetFailure>(TweetFailure.TWEET_DOES_NOT_EXISTS);
                return result;
            }

            const tweet = tweetDocument.data() as unknown as Tweet;

            const result = new Success<Tweet>(tweet);
            return result;
        } catch {
            const result = new Failure<TweetFailure>(TweetFailure.UNKNOWN);
            return result;
        }
    }

    async tweetsList(parameters: {
        authorId: String;
    } & PaginationQuery): Promise<Success<Paginated<Tweet>> | Failure<TweetsFeedFailure>> {
        const isAuthorExists = await UsersManager.shared.exists({
            userId: parameters.authorId
        });

        if (!isAuthorExists) {
            const result = new Failure<TweetsFeedFailure>(TweetsFeedFailure.AUTHOR_DOES_NOT_EXISTS);
            return result;
        }

        const tweetActivities = await StreamAssistant.shared.userFeed.activities({
            authorId: parameters.authorId,
            limit: parameters.limit,
            nextToken: parameters.nextToken,
        });

        if (tweetActivities === null) {
            const result = new Failure<TweetsFeedFailure>(TweetsFeedFailure.UNKNOWN);
            return result;
        }

        const tweets: Tweet[] = [];

        for (const partialTweet of tweetActivities.page) {
            const tweetResult = await this.tweet({
                tweetId: partialTweet.tweetId,
            });

            if (tweetResult instanceof Failure) {
                const result = new Failure<TweetsFeedFailure>(TweetsFeedFailure.UNKNOWN);
                return result;
            }

            tweets.push(tweetResult.data as Tweet);
        }

        const feed = new Paginated<Tweet>({
            page: tweets,
            nextToken: tweetActivities?.nextToken,
        });

        const result = new Success<Paginated<Tweet>>(feed);
        return result;
    }

    async deleteTweet(parameters: {
        tweetId: String;
    }): Promise<Success<Empty> | Failure<DeleteTweetFailure>> {
        // References
        const tweetsCollectionRef = DatabaseAssistant.shared.collection(TxDatabaseCollections.tweets);
        const tweetDocumentRef = tweetsCollectionRef.doc(parameters.tweetId.valueOf());

        try {
            const tweetDocument = await tweetDocumentRef.get();

            if (!tweetDocument.exists) {
                const result = new Failure<DeleteTweetFailure>(DeleteTweetFailure.TWEET_DOES_NOT_EXISTS);
                return result;
            }

            const tweet = tweetDocument.data() as unknown as Tweet;

            const remoteTweetResult = await StreamAssistant.shared.userFeed.removeTweetActivity({
                authorId: tweet.authorId,
                tweetId: tweet.id,
            });

            if (remoteTweetResult instanceof Failure) {
                const result = new Failure<DeleteTweetFailure>(DeleteTweetFailure.UNKNOWN);
                return result;
            }

            await DatabaseAssistant.shared.runTransaction(async (transaction) => {
                const usersCollectionRef = DatabaseAssistant.shared.collection(TxDatabaseCollections.users);
                const userDocumentRef = usersCollectionRef.doc(tweet.authorId.valueOf());

                const userDocument = await userDocumentRef.get();
                const user = userDocument.data() as unknown as User;

                transaction.update(
                    userDocumentRef,
                    { "activityDetails.tweetsCount": user.activityDetails.tweetsCount.valueOf() - 1 }
                );
            });

            // NOTE: Not deleting tweet from DB. Data might be useful later on.

            const result = new Success<Empty>({});
            return result;
        } catch {
            const result = new Failure<DeleteTweetFailure>(DeleteTweetFailure.UNKNOWN);
            return result;
        }
    }
}