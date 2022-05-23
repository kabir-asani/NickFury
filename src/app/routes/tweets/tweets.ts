import { Router, Request, Response } from "express";
import Joi from "joi";
import { kMaximumPaginatedPageLength } from "../../../managers/core/types";
import { TweetsManager } from "../../../managers/tweetsManager/tweetsManager";
import { Failure } from "../../../utils/typescriptx/typescriptx";
import { SessionizedRequest } from "../../core/override";
import { AllOkRouteSuccess, CreationRouteSuccess, InternalRouteFailure, NoContentRouteSuccess, UnimplementedRouteFailure } from "../../core/types";
import paginated from "../../middlewares/paginated/paginated";
import { selfishGuard } from "../../middlewares/selfieGuard/selfieGuard";
import { GroundZero, soldier } from "../../middlewares/soldier/soldier";
import comments from "./reactions/comments";
import likes from "./reactions/likes";

const tweets = Router({
    mergeParams: true
});

tweets.use(
    "/:tweetId/likes",
    likes
);

tweets.use(
    "/:tweetId/comments",
    comments
)

tweets.get(
    "/",
    paginated(),
    async (req: Request, res: Response) => {
        const session = (req as SessionizedRequest).session;
        const userId = req.params.userId;
        const nextToken = req.params.nextToken;
        const limit = parseInt(req.params.limit);

        const safeLimit = isNaN(limit) ? kMaximumPaginatedPageLength : limit;

        const tweets = await TweetsManager.shared.tweets({
            userId: userId || session.userId,
            viewerId: session.userId,
            nextToken: nextToken,
            limit: safeLimit
        });

        if (tweets !== null) {
            const response = new AllOkRouteSuccess(tweets);

            res
                .status(AllOkRouteSuccess.statusCode)
                .json(response);
        } else {
            const response = new InternalRouteFailure();

            res
                .status(InternalRouteFailure.statusCode)
                .json(response);
        }
    }
);

tweets.post(
    "/",
    [
        selfishGuard(),
        soldier({
            schema: Joi.object({
                text: Joi.string().required().max(256).min(1),
            }),
            groundZero: GroundZero.body,
        })
    ],
    async (req: Request, res: Response) => {
        const session = (req as SessionizedRequest).session;

        const parameters = req.body as {
            text: String;
        };

        const tweetCreation = await TweetsManager.shared.create({
            authorId: session.userId,
            tweet: {
                text: parameters.text
            }
        });

        if (tweetCreation instanceof Failure) {
            const response = new InternalRouteFailure();

            res
                .status(InternalRouteFailure.statusCode)
                .json(response);
        } else {
            const tweet = tweetCreation.data;

            const response = new CreationRouteSuccess(tweet);

            res
                .status(CreationRouteSuccess.statusCode)
                .json(response);
        }
    }
);

tweets.delete(
    "/:tweetId",
    [
        selfishGuard(),
        soldier({
            schema: Joi.object({
                tweetId: Joi.string().required(),
            }),
            groundZero: GroundZero.parameters
        }),
    ],
    async (req: Request, res: Response) => {
        const tweetId = req.params.tweetId;

        const tweetDeletion = await TweetsManager.shared.delete({
            tweetId: tweetId
        });

        if (tweetDeletion instanceof Failure) {
            const response = new InternalRouteFailure();

            res
                .status(InternalRouteFailure.statusCode)
                .json(response);
        } else {
            const response = new NoContentRouteSuccess();

            res
                .status(NoContentRouteSuccess.statusCode)
                .json(response);
        }
    }
)

export = tweets;