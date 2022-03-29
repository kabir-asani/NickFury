import * as uuid from 'uuid';

import { DatabaseAssistant } from "../../assistants/database/database";
import { AddTweetSuccess, RemoveTweetSuccess } from '../../assistants/stream/feeds/samaritanFeed/types';
import { StreamAssistant } from '../../assistants/stream/stream';
import { TxDatabaseCollections } from "../core/collections";
import { SamaritansManager } from "../samaritansManager/samaritansManager";
import { Tweet } from "./models";
import { CreateTweetFailure, CreateTweetSuccess, DeleteTweetFailure, DeleteTweetSuccess, Feed, UnknownDeleteTweetFailure, UnkownCreateTweetFailure } from "./types";

export class TweetsManager {
    public static readonly shared = new TweetsManager();

    async feed(parameters: {
        sid: String;
        limit?: Number;
        nextToken?: String;
    }): Promise<Feed | null> {
        const feed = await StreamAssistant.shared.samaritanFeed.feed({
            sid: parameters.sid,
            nextToken: parameters.nextToken,
            limit: parameters.limit,
        });

        if (feed !== null) {
            const tweets = Array<Tweet>();
            const partialTweets = feed.partialTweets;

            for (const partialTweet of partialTweets) {
                const collectionRef = DatabaseAssistant.shared.collection(TxDatabaseCollections.tweets);
                const documentRef = collectionRef.doc(partialTweet.tid.valueOf());
                const document = await documentRef.get();

                const tweet = document.data() as unknown as Tweet;
                tweets.push(tweet);
            }

            const result = new Feed({
                tweets: tweets,
                nextToken: feed.nextToken
            });
            return result;
        }

        const result = null;
        return result;
    }

    async createTweet(parameters: {
        text: String;
        sid: String;
    }): Promise<CreateTweetSuccess | CreateTweetFailure> {
        const isSamaritanPresent = await SamaritansManager.shared.exists({
            sid: parameters.sid
        });

        if (isSamaritanPresent) {
            const fid = uuid.v4();

            const tweetCreationResult = await StreamAssistant
                .shared
                .samaritanFeed
                .addTweet({
                    fid: fid,
                    sid: parameters.sid,
                });

            if (tweetCreationResult instanceof AddTweetSuccess) {
                const tweet: Tweet = {
                    tid: tweetCreationResult.tid.valueOf(),
                    fid: fid,
                    text: parameters.text,
                    creationDate: Date.now(),
                    authorSid: parameters.sid.valueOf(),
                    meta: {
                        likesCount: 0
                    },
                };

                const collectionRef = DatabaseAssistant.shared.collection(TxDatabaseCollections.tweets);
                const documentRef = collectionRef.doc(tweetCreationResult.tid.valueOf());

                try {
                    await documentRef.create(tweet);

                    const result = new CreateTweetSuccess({
                        tweet: tweet
                    });
                    return result;
                } catch {
                    const result = new UnkownCreateTweetFailure();
                    return result;
                }
            }
        }

        const result = new UnkownCreateTweetFailure();
        return result;
    }

    async deleteTweet(parameters: {
        tid: String;
        sid: String;
    }): Promise<DeleteTweetSuccess | DeleteTweetFailure> {
        const isSamaritanPresent = await SamaritansManager.shared.exists({
            sid: parameters.sid
        });

        if (isSamaritanPresent) {
            const remoteTweetResult = await StreamAssistant.shared.samaritanFeed.removeTweet({
                sid: parameters.sid,
                tid: parameters.tid
            });

            if (remoteTweetResult instanceof RemoveTweetSuccess) {
                // Not deleting tweet from DB.
                // Data might be useful later on.
                const result = new DeleteTweetSuccess();
                return result;
            }
        }

        const result = new UnknownDeleteTweetFailure();
        return result;
    }
}