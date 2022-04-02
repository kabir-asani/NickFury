import { Router, Request, Response } from "express";
import Joi from "joi";
import { SessionsManager } from "../../../../../managers/sessionManager/sessionsManager";
import { UsersManager } from "../../../../../managers/usersManager/usersManager";
import { InternalRouteFailure } from "../../../../core/types";
import { GroundZero, soldier } from "../../../../middlewares/soldier/soldier";

const followings = Router({
    mergeParams: true
});

followings.get(
    "/",
    async (req: Request, res: Response) => {
        const { authorization: sessionId } = req.headers;
        const { userId } = req.params;

        if (userId !== undefined) {
            const user = await UsersManager.shared.user({
                userId: userId as String
            });

            if (user === null) {
                const response = new InternalRouteFailure();

                res
                    .status(InternalRouteFailure.statusCode)
                    .json(response);

                return;
            }

            // TODO: Respond with enriched followers
        } else {
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

            // TODO: Respond with enriched followers
        }
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

        // TODO: Add follower
    },
);

followings.delete(
    "/",
    soldier({
        schema: Joi.object({
            userId: Joi.string().required(),
        }),
        groundZero: GroundZero.body,
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

export = followings;