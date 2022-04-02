import * as uuid from 'uuid';

import { DatabaseAssistant } from "../../assistants/database/database";
import { StreamAssistant } from '../../assistants/stream/stream';
import { Dately } from '../../utils/dately/dately';
import { Empty, Failure, Success } from '../../utils/typescriptx/typescriptx';
import { TxDatabaseCollections } from "../core/collections";
import { Paginated } from '../core/types';
import { BookmarksManager } from '../usersManager/bookmarksManager/bookmarksManager';
import { User } from '../usersManager/models';
import { UsersManager } from '../usersManager/usersManager';
import { LikesManager } from './likesManager/likesManager';
import { Tweet } from "./models";
import { CreateTweetFailure, DeleteTweetFailure } from "./types";

export class TweetsManager {
    public static readonly shared = new TweetsManager();

    async exits(parameters: {
        tweetId: String
    }): Promise<Boolean> {
        const collectionRef = DatabaseAssistant.shared.collection(TxDatabaseCollections.tweets) ;
        const documentRef = collectionRef.doc(parameters.tweetId.valueOf());

        const document = await documentRef.get();

        if (document.exists) {
            return true;
        } else {
            return false;
        }
    }

    async createTweet(parameters: {
        text: String;
        authorId: String;
    }): Promise<Success<Tweet> | Failure<CreateTweetFailure>> {
        const complimentaryTweetId = uuid.v4();

        const outcome = await StreamAssistant
            .shared
            .userFeed
            .createTweetActivity({
                complimentaryTweetId: complimentaryTweetId,
                authorId: parameters.authorId,
            });

        if (outcome instanceof Success) {
            const tweet: Tweet = {
                tweetId: outcome.data.id,
                complimentaryTweetId: complimentaryTweetId,
                text: parameters.text,
                creationDate: Dately.shared.now(),
                authorId: parameters.authorId.valueOf(),
                meta: {
                    likesCount: 0
                },
            };

            const tweetsCollectionRef = DatabaseAssistant.shared.collection(TxDatabaseCollections.tweets);
            const usersCollectionRef = DatabaseAssistant.shared.collection(TxDatabaseCollections.users);

            const tweetDocumentRef = tweetsCollectionRef.doc(outcome.data.id.valueOf());
            const userDocumentRef = usersCollectionRef.doc(parameters.authorId.valueOf());

            try {
                await DatabaseAssistant.shared.runTransaction(async (transaction) => {
                    const userDocument = await userDocumentRef.get();
                    const user = userDocument.data() as unknown as User;

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

        const result = new Failure<CreateTweetFailure>(CreateTweetFailure.UNKNOWN);
        return result;
    }

    async tweet(parameters: {
        tweetId: String;
    }): Promise<Tweet | null> {
        const tweetsCollectionRef = DatabaseAssistant.shared.collection(TxDatabaseCollections.tweets);
        const tweetDocumentRef = tweetsCollectionRef.doc(parameters.tweetId.valueOf());
        const tweetDocument = await tweetDocumentRef.get();

        if (tweetDocument.exists) {
            const tweet = tweetDocument.data() as unknown as Tweet;

            const result = tweet;
            return result;
        }

        const result = null;
        return result;
    }

    async tweets(parameters: {
        authorId: String;
        limit?: Number;
        nextToken?: String;
    }): Promise<Paginated<Tweet> | null> {
        const paginated = await StreamAssistant.shared.userFeed.tweets({
            authorId: parameters.authorId,
            limit: parameters.limit,
            nextToken: parameters.nextToken,
        });

        if (paginated !== null) {
            const tweets: Tweet[] = [];

            for (const partialTweet of paginated.page) {
                const tweet = await this.tweet({
                    tweetId: partialTweet.tweetId,
                });

                if (tweet == null) {
                    const result = null;
                    return result;
                }

                tweets.push(tweet);
            }

            const result = new Paginated<Tweet>({
                page: tweets,
                nextToken: paginated?.nextToken,
            });
            return result;
        }

        const result = null;
        return result;
    }

    async deleteTweet(parameters: {
        tweetId: String;
    }): Promise<Success<Empty> | Failure<DeleteTweetFailure>> {
        const tweetsCollectionRef = DatabaseAssistant.shared.collection(TxDatabaseCollections.tweets);
        const tweetDocumentRef = tweetsCollectionRef.doc(parameters.tweetId.valueOf());
        const tweetDocument = await tweetDocumentRef.get();

        if (tweetDocument.exists) {
            const tweet = tweetDocument.data() as unknown as Tweet;

            const remoteTweetResult = await StreamAssistant.shared.userFeed.remoteTweetActivity({
                authorId: tweet.authorId,
                tweetId: tweet.tweetId
            });

            if (remoteTweetResult instanceof Success) {
                const usersCollectionRef = DatabaseAssistant.shared.collection(TxDatabaseCollections.users);
                const userDocumentRef = usersCollectionRef.doc(tweet.authorId.valueOf());
                const userDocument = await userDocumentRef.get();
                const user = userDocument.data() as unknown as User;

                try {
                    await userDocumentRef.update({
                        tweetsDetails: {
                            tweetsCount: Math.max(
                                0,
                                user.tweetsDetails.tweetsCount.valueOf() - 1
                            ),
                        },
                    });


                    // Not deleting tweet from DB. Data might be useful later on.

                    const result = new Success<Empty>({});
                    return result;
                } catch {
                    const result = new Failure<DeleteTweetFailure>(DeleteTweetFailure.UNKNOWN);
                    return result;
                }
            }
        }

        const result = new Failure<DeleteTweetFailure>(DeleteTweetFailure.UNKNOWN);
        return result;
    }
}