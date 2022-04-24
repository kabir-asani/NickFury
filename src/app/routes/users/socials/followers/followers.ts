import { Router, Request, Response } from "express";
import Joi from "joi";
import { Paginated } from "../../../../../managers/core/types";
import { SessionsManager } from "../../../../../managers/sessionsManager/sessionsManager";
import { Follower } from "../../../../../managers/usersManager/socialsManager/models";
import { SocialsManager } from "../../../../../managers/usersManager/socialsManager/socialsManager";
import { FollowersFeedFailure } from "../../../../../managers/usersManager/socialsManager/types";
import { Failure } from "../../../../../utils/typescriptx/typescriptx";
import { SessionizedRequest } from "../../../../core/override";
import { InternalRouteFailure, NoResourceRouteFailure, OkRouteSuccess } from "../../../../core/types";
import paginated from "../../../../middlewares/paginated/paginated";
import { soldier, GroundZero } from "../../../../middlewares/soldier/soldier";

const followers = Router({
    mergeParams: true
});

followers.use((req, res, next) => {
    switch (req.method) {
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

followers.get(
    "/",
    paginated(),
    async (req: Request, res: Response) => {
        const session = (req as SessionizedRequest).session;
        const { userId } = req.params;
        const { nextToken, limit } = req.query;

        const followersResult = await SocialsManager.shared.followers({
            userId: userId || session.userId,
            limit: limit !== undefined ? Number(limit) : undefined,
            nextToken: nextToken !== undefined ? nextToken as unknown as String : undefined,
        });


        if (followersResult instanceof Failure) {
            switch (followersResult.reason) {
                case FollowersFeedFailure.USER_DOES_NOT_EXISTS: {
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
        const paginatedFollowers = new Paginated<Follower>({
            page: followersResult.data.page,
            nextToken: followersResult.data.nextToken,
        });

        const response = new OkRouteSuccess(paginatedFollowers);

        res
            .status(OkRouteSuccess.statusCode)
            .json(response);
    },
);

followers.delete(
    "/:userId",
    soldier({
        schema: Joi.object({
            userId: Joi.string().required(),
        }),
        groundZero: GroundZero.parameters,
    }),
    async (req: Request, res: Response) => {
        const { authorization: sessionId } = req.headers;

        const session = await SessionsManager.shared.session({
            sessionId: sessionId as String
        });

        if (session === null) {
            const response = new InternalRouteFailure();

            res
                .status(InternalRouteFailure.statusCode)
                .json(response);

            return;
        }

        // TODO: Remove follower
    }
)

export = followers;