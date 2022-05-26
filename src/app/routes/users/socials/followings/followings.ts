import { Router, Request, Response } from "express";
import Joi from "joi";
import { SocialsManager } from "../../../../../managers/socialsManager/socialsManager";
import {
    FollowFailureReason,
    UnfollowFailureReason
} from "../../../../../managers/socialsManager/types";
import { Failure } from "../../../../../utils/typescriptx/typescriptx";
import { SessionizedRequest } from "../../../../core/override";
import {
    AllOkRouteSuccess,
    InternalRouteFailure,
    NoContentRouteSuccess,
    NoResourceRouteFailure,
    UnimplementedRouteFailure
} from "../../../../core/types";
import paginated from "../../../../middlewares/paginated/paginated";
import { selfishGuard } from "../../../../middlewares/selfieGuard/selfieGuard";
import { GroundZero, soldier } from "../../../../middlewares/soldier/soldier";

const followings = Router({
    mergeParams: true
});

followings.get(
    "/",
    paginated(),
    async (req: Request, res: Response) => {
        const session = (req as SessionizedRequest).session;

        const userId = req.params.userId;

        if (userId !== undefined && userId !== null) {
            const viewableFollowings = await SocialsManager.shared.viewableFollowings({
                userId: userId,
                viewerId: session.userId
            });

            if (viewableFollowings == null) {
                const response = new InternalRouteFailure();

                res
                    .status(InternalRouteFailure.statusCode)
                    .json(response);
            } else {
                const response = new AllOkRouteSuccess(viewableFollowings);

                res
                    .status(AllOkRouteSuccess.statusCode)
                    .json(response);
            }
        } else {
            const viewableFollowings = await SocialsManager.shared.viewableFollowings({
                userId: session.userId,
                viewerId: session.userId
            });

            if (viewableFollowings == null) {
                const response = new InternalRouteFailure();

                res
                    .status(InternalRouteFailure.statusCode)
                    .json(response);
            } else {
                const response = new AllOkRouteSuccess(viewableFollowings);

                res
                    .status(AllOkRouteSuccess.statusCode)
                    .json(response);
            }
        }
    },
);

followings.post(
    "/",
    [
        selfishGuard(),
        soldier({
            schema: Joi.object({
                userId: Joi.string().required(),
            }),
            groundZero: GroundZero.body,
        })
    ],
    async (req: Request, res: Response) => {
        const session = (req as SessionizedRequest).session;

        const parameters = req.body as {
            userId: String
        };

        const followResult = await SocialsManager.shared.follow({
            followerId: session.userId,
            followingId: parameters.userId
        });

        if (followResult instanceof Failure) {
            switch (followResult.reason) {
                case FollowFailureReason.followingDoesNotExists: {
                    const response = new NoResourceRouteFailure();

                    res
                        .status(NoResourceRouteFailure.statusCode)
                        .json(response);

                    break;
                }
                default: {
                    const response = new InternalRouteFailure();

                    res
                        .status(InternalRouteFailure.statusCode)
                        .json(response);

                    break;
                }
            }
        } else {
            const response = new NoContentRouteSuccess();

            res
                .status(NoContentRouteSuccess.statusCode)
                .json(response);
        }
    },
);

followings.delete(
    "/:userId",
    [
        selfishGuard(),
        soldier({
            schema: Joi.object({
                userId: Joi.string().required(),
            }),
            groundZero: GroundZero.parameters,
        })
    ],
    async (req: Request, res: Response) => {
        const session = (req as SessionizedRequest).session;

        const userId = req.params.userId as String;

        const unfollowResult = await SocialsManager.shared.unfollow({
            followerId: session.userId,
            followingId: userId
        });

        if (unfollowResult instanceof Failure) {
            switch (unfollowResult.reason) {
                case UnfollowFailureReason.relationshipDoesNotExists: {
                    const response = new NoResourceRouteFailure();

                    res
                        .status(NoResourceRouteFailure.statusCode)
                        .json(response);

                    break;
                }
                default: {
                    const response = new InternalRouteFailure();

                    res
                        .status(InternalRouteFailure.statusCode)
                        .json(response);

                    break;
                }
            }
        } else {
            const response = new NoContentRouteSuccess();

            res
                .status(NoContentRouteSuccess.statusCode)
                .json(response);
        }
    }
)

export = followings;