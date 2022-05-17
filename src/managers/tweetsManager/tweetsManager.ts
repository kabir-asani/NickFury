import * as uuid from "uuid";
import { DatabaseAssistant, DatabaseCollections } from "../../assistants/database/database";
import { StreamAssistant } from "../../assistants/stream/stream";
import { Dately } from "../../utils/dately/dately";
import { Failure, Success } from "../../utils/typescriptx/typescriptx";
import { Tweet, TweetViewables, ViewableTweet } from "../core/models";
import { Paginated } from "../core/types";
import { TweetCreationFailureReason } from "./types";

export class TweetsManager {
    static readonly shared = new TweetsManager();

    private constructor() { }

    async create(parameters: {
        authorId: String;
        tweet: {
            text: String;
        }
    }): Promise<Success<Tweet> | Failure<TweetCreationFailureReason>> {
        const complimentaryTweetId = uuid.v4();

        const tweetActivityCreation = await StreamAssistant.shared.selfFeed.addTweetActivity({
            authorId: parameters.authorId,
            complimentaryTweetId: complimentaryTweetId
        });

        if (tweetActivityCreation instanceof Failure) {
            const reply = new Failure<TweetCreationFailureReason>(
                TweetCreationFailureReason.unknown
            );

            return reply;
        }

        const tweet: Tweet = {
            id: tweetActivityCreation.data.tweetId,
            complimentaryId: tweetActivityCreation.data.complimentaryTweetId,
            authorId: tweetActivityCreation.data.authorId,
            text: parameters.tweet.text,
            creationDate: Dately.shared.now(),
            lastUpdatedDate: Dately.shared.now(),
            interactionDetails: {
                commentsCount: 0,
                likesCount: 0
            }
        };

        const tweetsCollection = DatabaseAssistant.shared.collection(DatabaseCollections.tweets);
        const tweetDocumentRef = tweetsCollection.doc(complimentaryTweetId);

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

    async tweets(parameters: {
        userId: String;
    }): Promise<Paginated<Tweet | ViewableTweet> | null> {
        return null;
    }

    private async viewables(parameters: {
        tweetId: String;
        viewerId: String;
    }): Promise<TweetViewables | null> {
        // TODO: Implement `TweetsManager.viewables`
        return null;
    }
}