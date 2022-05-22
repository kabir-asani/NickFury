import * as uuid from "uuid";
import { DatabaseAssistant, DatabaseCollections } from "../../assistants/database/database";
import { StreamAssistant } from "../../assistants/stream/stream";
import { Dately } from "../../utils/dately/dately";
import { Failure, Success } from "../../utils/typescriptx/typescriptx";
import { Tweet, TweetViewables, ViewableTweet, ViewableUser } from "../core/models";
import { UsersManager } from "../usersManager/usersManager";
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

    async tweet(parameters: {
        tweetId: String;
        viewerId?: String;
    }): Promise<Tweet | ViewableTweet | null> {
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

    private async viewables(parameters: {
        tweetId: String;
        authorId: String;
        viewerId: String;
    }): Promise<TweetViewables | null> {
        const viewableAuthor = await UsersManager.shared.user({
            id: parameters.authorId,
            viewerId: parameters.viewerId
        });

        if (viewableAuthor === null) {
            return null;
        }

        // TODO: Determine if the tweet is bookmarked by the viewer;
        const isBookmarked = false;

        const viewables: TweetViewables = {
            author: viewableAuthor as ViewableUser,
            bookmarked: isBookmarked
        };

        return viewables;
    }
}