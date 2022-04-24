import { Router, Request, Response } from "express";
import Joi from "joi";
import { Paginated } from "../../../../../managers/core/types";
import { SessionsManager } from "../../../../../managers/sessionsManager/sessionsManager";
import { Follower } from "../../../../../managers/usersManager/socialsManager/models";
import { SocialsManager } from "../../../../../managers/usersManager/socialsManager/socialsManager";
import { FollowFailure, FollowingsFeedFailure, UnfollowFailure } from "../../../../../managers/usersManager/socialsManager/types";
import { Failure } from "../../../../../utils/typescriptx/typescriptx";
import { SessionizedRequest } from "../../../../core/override";
import { InternalRouteFailure, NoContentRouteSuccess, NoResourceRouteFailure, OkRouteSuccess, SemanticRouteFailure } from "../../../../core/types";
import { GroundZero, soldier } from "../../../../middlewares/soldier/soldier";

const followings = Router({
    mergeParams: true
});

followings.use((req, res, next) => {
    switch (req.method) {
        case "PUT":
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

followings.get(
    "/",
    async (req: Request, res: Response) => {
        const session = (req as SessionizedRequest).session;
        const { userId } = req.params;
        const { nextToken, limit } = req.query;

        const followingsResult = await SocialsManager.shared.followings({
            userId: userId || session.userId,
            limit: limit !== undefined ? Number(limit) : undefined,
            nextToken: nextToken !== undefined ? nextToken as unknown as String : undefined,
        });


        if (followingsResult instanceof Failure) {
            switch (followingsResult.reason) {
                case FollowingsFeedFailure.USER_DOES_NOT_EXISTS: {
                    if (userId !== undefined) {
                        const response = new NoResourceRouteFailure();

                        res
                            .status(NoResourceRouteFailure.statusCode)
                            .json(response);

                        return;
                    }
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

        // TODO: Make viewable
        const paginatedFollowings = new Paginated<Follower>({
            page: followingsResult.data.page,
            nextToken: followingsResult.data.nextToken,
        });

        const response = new OkRouteSuccess(paginatedFollowings);

        res
            .status(OkRouteSuccess.statusCode)
            .json(response);
    },
);

followings.put(
    "/",
    soldier({
        schema: Joi.object({
            userId: Joi.string().required(),
        }),
        groundZero: GroundZero.body,
    }),
    async (req: Request, res: Response) => {
        const session = (req as SessionizedRequest).session;
        const { userId } = req.body;

        const followResult = await SocialsManager.shared.follow({
            followerUserId: session.userId,
            followingUserId: userId
        });

        if (followResult instanceof Failure) {
            switch (followResult.reason) {
                case FollowFailure.FOLLOWER_DOES_NOT_EXISTS: {
                    const response = new NoResourceRouteFailure();

                    res
                        .status(NoResourceRouteFailure.statusCode)
                        .json(response);

                    return;
                }
                case FollowFailure.FOLLOW_ALREADY_EXISTS: {
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
            .send(NoContentRouteSuccess.statusCode)
            .json(response);
    },
);

followings.delete(
    "/:userId",
    soldier({
        schema: Joi.object({
            userId: Joi.string().required(),
        }),
        groundZero: GroundZero.parameters,
    }),
    async (req: Request, res: Response) => {
        const session = (req as SessionizedRequest).session;
        const { userId } = req.body;

        const unfollowResult = await SocialsManager.shared.unfollow({
            followerUserId: session.userId,
            followingUserId: userId
        });

        if (unfollowResult instanceof Failure) {
            switch (unfollowResult.reason) {
                case UnfollowFailure.FOLLOWING_DOES_NOT_EXISTS:
                case UnfollowFailure.FOLLOW_DOES_NOT_EXISTS: {
                    const response = new NoResourceRouteFailure();

                    res
                        .status(NoResourceRouteFailure.statusCode)
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
            .send(NoContentRouteSuccess.statusCode)
            .json(response);
    }
)

export = followings;