import { Router, Request, Response } from "express";
import Joi from "joi";
import { kMaximumPaginatedPageLength } from "../../../managers/core/types";
import TweetsManager from "../../../managers/tweetsManager/tweetsManager";
import { PaginatedViewableTweetsFailureReason } from "../../../managers/tweetsManager/types";
import { Failure } from "../../../utils/typescriptx/typescriptx";
import { SessionizedRequest } from "../../core/override";
import {
    AllOkRouteSuccess,
    CreationRouteSuccess,
    InternalRouteFailure,
    NoContentRouteSuccess,
    SemanticRouteFailure,
} from "../../core/types";
import paginated from "../../middlewares/paginated/paginated";
import selfishGuard from "../../middlewares/selfieGuard/selfieGuard";
import soldier, { GroundZero } from "../../middlewares/soldier/soldier";
import comments from "./reactions/comments";
import likes from "./reactions/likes";

const tweets = Router({
    mergeParams: true,
});

tweets.use("/:tweetId/likes", likes);

tweets.use("/:tweetId/comments", comments);

tweets.get("/", paginated(), async (req: Request, res: Response) => {
    const session = (req as SessionizedRequest).session;
    const userId = req.params.userId;
    const nextToken = req.params.nextToken;
    const limit = parseInt(req.params.limit);

    const safeLimit = isNaN(limit) ? kMaximumPaginatedPageLength : limit;

    const paginatedViewableTweetsResult =
        await TweetsManager.shared.paginatedViewableTweetsOf({
            userId: userId || session.userId,
            viewerId: session.userId,
            nextToken: nextToken,
            limit: safeLimit,
        });

    if (paginatedViewableTweetsResult instanceof Failure) {
        switch (paginatedViewableTweetsResult.reason) {
            case PaginatedViewableTweetsFailureReason.malformedParameters: {
                const response = new SemanticRouteFailure();

                res.status(SemanticRouteFailure.statusCode).json(response);

                return;
            }
            default: {
                const response = new InternalRouteFailure();

                res.status(InternalRouteFailure.statusCode).json(response);

                return;
            }
        }
    }

    const paginatedResult = paginatedViewableTweetsResult.data;

    const response = new AllOkRouteSuccess(paginatedResult);

    res.status(AllOkRouteSuccess.statusCode).json(response);
});

tweets.post(
    "/",
    [
        selfishGuard(),
        soldier({
            schema: Joi.object({
                text: Joi.string().required().max(256).min(1),
            }),
            groundZero: GroundZero.body,
        }),
    ],
    async (req: Request, res: Response) => {
        const session = (req as SessionizedRequest).session;

        const parameters = req.body as {
            text: String;
        };

        const tweetCreationResult = await TweetsManager.shared.create({
            authorId: session.userId,
            data: {
                text: parameters.text,
            },
        });

        if (tweetCreationResult instanceof Failure) {
            const response = new InternalRouteFailure();

            res.status(InternalRouteFailure.statusCode).json(response);

            return;
        }

        const tweet = tweetCreationResult.data;

        const response = new CreationRouteSuccess(tweet);

        res.status(CreationRouteSuccess.statusCode).json(response);
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
            groundZero: GroundZero.parameters,
        }),
    ],
    async (req: Request, res: Response) => {
        const tweetId = req.params.tweetId;

        const tweetDeletionResult = await TweetsManager.shared.delete({
            tweetId: tweetId,
        });

        if (tweetDeletionResult instanceof Failure) {
            const response = new InternalRouteFailure();

            res.status(InternalRouteFailure.statusCode).json(response);

            return;
        }

        const response = new NoContentRouteSuccess();

        res.status(NoContentRouteSuccess.statusCode).json(response);
    }
);

export default tweets;
