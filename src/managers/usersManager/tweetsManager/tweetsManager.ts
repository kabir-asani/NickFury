import { UserMetadata } from 'firebase-admin/lib/auth/user-record';
import * as uuid from 'uuid';

import { DatabaseAssistant } from "../../../assistants/database/database";
import { StreamAssistant } from '../../../assistants/stream/stream';
import { Dately } from '../../../utils/dately/dately';
import { Empty, Failure, Success } from '../../../utils/typescriptx/typescriptx';
import { DatabaseCollections } from "../../core/collections";
import { Paginated, PaginationQuery } from '../../core/types';
import { User } from '../models';
import { UsersManager } from '../usersManager';
import { EnrichedTweet, Tweet } from "./models";
import { CreateTweetFailure, DeleteTweetFailure, TweetsFeedFailure as TweetsFeedFailure, TweetFailure } from "./types";

// In all of the functions below, we're assuming that a user 
// corresponding to the given `authorId` always exists.

export class TweetsManager {
    public static readonly shared = new TweetsManager();

    async exits(parameters: {
        tweetId: String
    }): Promise<Boolean> {
        // References
        const tweetsCollectionRef = DatabaseAssistant.shared.collectionGroup(DatabaseCollections.tweets);
        const tweetsQuery = tweetsCollectionRef.where(
            "id",
            "==",
            parameters.tweetId
        ).limit(1);

        try {
            const tweetsQuerySnapshot = await tweetsQuery.get();

            if (tweetsQuerySnapshot.empty) {
                return false;
            } else {
                return true;
            }
        } catch {
            return false;
        }
    }

    async createTweet(parameters: {
        text: String;
        authorId: String;
    }): Promise<Success<Tweet> | Failure<CreateTweetFailure>> {
        const isAuthorExists = await UsersManager.shared.exists({
            userId: parameters.authorId
        });

        if (!isAuthorExists) {
            const result = new Failure<CreateTweetFailure>(CreateTweetFailure.AUTHOR_DOES_NOT_EXISTS);
            return result;
        }

        const complimentaryTweetId = uuid.v4();

        const createTweetActivityResult = await StreamAssistant
            .shared
            .userFeed
            .createTweetActivity({
                complimentaryTweetId: complimentaryTweetId,
                authorId: parameters.authorId,
            });

        if (createTweetActivityResult instanceof Failure) {
            const result = new Failure<CreateTweetFailure>(CreateTweetFailure.UNKNOWN);
            return result;
        }

        const tweet: Tweet = {
            id: createTweetActivityResult.data.id,
            complimentaryTweetId: complimentaryTweetId,
            text: parameters.text,
            creationDate: Dately.shared.now(),
            authorId: parameters.authorId.valueOf(),
            meta: {
                likesCount: 0
            },
        };

        try {
            await DatabaseAssistant.shared.runTransaction(async (transaction) => {
                // References
                const usersCollectionRef = DatabaseAssistant.shared.collection(DatabaseCollections.users);
                const userDocumentRef = usersCollectionRef.doc(parameters.authorId.valueOf());

                const tweetsCollectionRef = userDocumentRef.collection(DatabaseCollections.tweets);
                const tweetDocumentRef = tweetsCollectionRef.doc(tweet.id.valueOf());

                const userDocument = await userDocumentRef.get();
                const user = userDocument.data() as unknown as User;

                // Action
                const updatedUser: User = {
                    ...user,
                    tweetsDetails: {
                        tweetsCount: user.tweetsDetails.tweetsCount.valueOf() + 1,
                    }
                };

                transaction.create(
                    tweetDocumentRef,
                    tweet,
                );
                transaction.update(
                    userDocumentRef,
                    updatedUser,
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
        authorId: String;
        tweetId: String;
    }): Promise<Success<EnrichedTweet> | Failure<TweetFailure>> {
        // References
        const usersCollectionRef = DatabaseAssistant.shared.collection(DatabaseCollections.users);
        const userDocumentRef = usersCollectionRef.doc(parameters.authorId.valueOf());

        const tweetsCollectionRef = userDocumentRef.collection(DatabaseCollections.tweets);
        const tweetDocumentRef = tweetsCollectionRef.doc(parameters.tweetId.valueOf());

        // Action
        try {
            const userDocument = await userDocumentRef.get();
            const tweetDocument = await tweetDocumentRef.get();

            if (userDocument.exists) {
                if (tweetDocument.exists) {
                    const tweet = tweetDocument.data() as unknown as Tweet;
                    const author = userDocument.data() as unknown as User;

                    const enrichedTweet: EnrichedTweet = {
                        ...tweet,
                        author: author
                    }

                    const result = new Success<EnrichedTweet>(enrichedTweet);
                    return result;
                } else {
                    const result = new Failure<TweetFailure>(TweetFailure.TWEET_DOES_NOT_EXISTS);
                    return result;
                }
            } else {
                const result = new Failure<TweetFailure>(TweetFailure.AUTHOR_DOES_NOT_EXISTS);
                return result;
            }
        } catch {
            const result = new Failure<TweetFailure>(TweetFailure.UNKNOWN);
            return result;
        }
    }

    async tweetsFeed(parameters: {
        authorId: String;
    } & PaginationQuery): Promise<Success<Paginated<EnrichedTweet>> | Failure<TweetsFeedFailure>> {
        const isAuthorExists = await UsersManager.shared.exists({
            userId: parameters.authorId
        });

        if (!isAuthorExists) {
            const result = new Failure<TweetsFeedFailure>(TweetsFeedFailure.AUTHOR_DOES_NOT_EXISTS);
            return result;
        }

        const activities = await StreamAssistant.shared.userFeed.activities({
            authorId: parameters.authorId,
            limit: parameters.limit,
            nextToken: parameters.nextToken,
        });

        if (activities === null) {
            const result = new Failure<TweetsFeedFailure>(TweetsFeedFailure.UNKNOWN);
            return result;
        }

        const tweets: EnrichedTweet[] = [];

        for (const partialTweet of activities.page) {
            const tweetResult = await this.tweet({
                authorId: partialTweet.authorId,
                tweetId: partialTweet.tweetId,
            });

            if (tweetResult instanceof Failure) {
                const result = new Failure<TweetsFeedFailure>(TweetsFeedFailure.UNKNOWN);
                return result;
            }

            tweets.push(tweetResult.data);
        }

        const feed = new Paginated<EnrichedTweet>({
            page: tweets,
            nextToken: activities?.nextToken,
        });

        const result = new Success<Paginated<EnrichedTweet>>(feed);
        return result;
    }

    async deleteTweet(parameters: {
        tweetId: String;
    }): Promise<Success<Empty> | Failure<DeleteTweetFailure>> {
        // References
        const tweetsCollectionRef = DatabaseAssistant.shared.collectionGroup(DatabaseCollections.tweets);
        const tweetsQuery = tweetsCollectionRef.where(
            "id",
            "==",
            parameters.tweetId
        ).limit(1);

        try {
            const tweetsQuerySnapshot = await tweetsQuery.get();

            if (tweetsQuerySnapshot.empty) {
                const result = new Failure<DeleteTweetFailure>(DeleteTweetFailure.TWEET_DOES_NOT_EXISTS);
                return result;
            }

            const tweet = tweetsQuerySnapshot.docs[0].data() as unknown as Tweet;

            const remoteTweetResult = await StreamAssistant.shared.userFeed.remoteTweetActivity({
                authorId: tweet.authorId,
                tweetId: tweet.id
            });

            if (remoteTweetResult instanceof Failure) {
                const result = new Failure<DeleteTweetFailure>(DeleteTweetFailure.UNKNOWN);
                return result;
            }

            // References
            const usersCollectionRef = DatabaseAssistant.shared.collection(DatabaseCollections.users);
            const userDocumentRef = usersCollectionRef.doc(tweet.authorId.valueOf());

            try {
                const userDocument = await userDocumentRef.get();
                const user = userDocument.data() as unknown as User;

                await userDocumentRef.update({
                    tweetsDetails: {
                        tweetsCount: Math.max(
                            0,
                            user.tweetsDetails.tweetsCount.valueOf() - 1
                        ),
                    },
                });

                // * Not deleting tweet from DB. Data might be useful later on. *

                const result = new Success<Empty>({});
                return result;
            } catch {
                const result = new Failure<DeleteTweetFailure>(DeleteTweetFailure.UNKNOWN);
                return result;
            }
        } catch {
            const result = new Failure<DeleteTweetFailure>(DeleteTweetFailure.UNKNOWN);
            return result;
        }

    }
}