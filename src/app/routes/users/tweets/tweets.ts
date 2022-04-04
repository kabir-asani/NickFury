import { Router, Request, Response } from "express";
import Joi from "joi";
import { Paginated } from "../../../../managers/core/types";
import { Tweet } from "../../../../managers/tweetsManager/models";
import { TweetsManager } from "../../../../managers/tweetsManager/tweetsManager";
import { CreateTweetFailure, DeleteTweetFailure } from "../../../../managers/tweetsManager/types";
import { Failure } from "../../../../utils/typescriptx/typescriptx";
import { SessionizedRequest } from "../../../core/override";
import { CreatedRouteSuccess, InternalRouteFailure, NoContentRouteSuccess, NoResourceRouteFailure, OkRouteSuccess, SemanticRouteFailure } from "../../../core/types";
import paginated from "../../../middlewares/paginated/paginated";
import { GroundZero, soldier } from "../../../middlewares/soldier/soldier";
import likes from "./likes";

const tweets = Router({
    mergeParams: true
});

tweets.use(
    "/:tweetId/likes",
    likes
);

tweets.use((req, res, next) => {
    switch (req.method) {
        case "POST":
        case "DELETE": {
            const { userId } = req.params;

            if (userId !== undefined) {
                const response = new NoResourceRouteFailure();

                res
                    .status(NoResourceRouteFailure.statusCode)
                    .json(response);

                return;
            }

            return next();
        }
        default:
            return next();
    }
});

tweets.get(
    "/",
    paginated(),
    async (req: Request, res: Response) => {
        const session = (req as SessionizedRequest).session;
        const { nextToken, limit } = req.query;

        const { userId } = req.params;

        const feedResult = await TweetsManager.shared.tweetsFeed({
            authorId: userId || session.userId,
            nextToken: nextToken !== undefined ? nextToken as unknown as String : undefined,
            limit: limit !== undefined ? Number(limit) : undefined,
        });

        if (feedResult instanceof Failure) {
            switch (feedResult.reason) {
                default:
                    const response = new InternalRouteFailure();

                    res.
                        status(InternalRouteFailure.statusCode)
                        .json(response);

                    return;
            }
        }

        const paginatedTweets = new Paginated<Tweet>({
            page: feedResult.data.page,
            nextToken: feedResult.data.nextToken
        });

        const response = new OkRouteSuccess(paginatedTweets);

        res
            .status(OkRouteSuccess.statusCode)
            .json(response);
    }
);

tweets.post(
    "/",
    soldier({
        schema: Joi.object({
            text: Joi.string().required().max(256).min(1),
        }),
        groundZero: GroundZero.body,
    }),
    async (req: Request, res: Response) => {
        const session = (req as SessionizedRequest).session;

        const { text } = req.body;

        const createTweetResult = await TweetsManager.shared.createTweet({
            authorId: session.userId,
            text: text
        });

        if (createTweetResult instanceof Failure) {
            switch (createTweetResult.reason) {
                case CreateTweetFailure.MALFORMED_TWEET: {
                    const response = new SemanticRouteFailure();

                    res
                        .status(SemanticRouteFailure.statusCode)
                        .json(response);

                    return;
                }
                default: {
                    const response = new InternalRouteFailure();

                    res
                        .status(InternalRouteFailure.statusCode)
                        .json(response);

                    return;
                }
            }
        }

        const tweet = createTweetResult.data;

        const response = new CreatedRouteSuccess(tweet);

        res
            .status(CreatedRouteSuccess.statusCode)
            .json(response);
    }
);

tweets.delete(
    "/:tweetId",
    soldier({
        schema: Joi.object({
            tweetId: Joi.string().required(),
        }),
        groundZero: GroundZero.parameters
    }),
    async (req: Request, res: Response) => {
        const { tweetId } = req.params;

        const deleteTweetResult = await TweetsManager.shared.deleteTweet({
            tweetId: tweetId
        });

        if (deleteTweetResult instanceof Failure) {
            switch (deleteTweetResult.reason) {
                case DeleteTweetFailure.TWEET_DOES_NOT_EXISTS: {
                    const response = new SemanticRouteFailure();

                    res
                        .status(SemanticRouteFailure.statusCode)
                        .json(response);

                    return;
                }
                default: {
                    const response = new InternalRouteFailure();

                    res
                        .status(InternalRouteFailure.statusCode)
                        .json(response);

                    return;
                }
            }
        }

        const response = new NoContentRouteSuccess();

        res
            .status(NoContentRouteSuccess.statusCode)
            .json(response);
    }
)

export = tweets;