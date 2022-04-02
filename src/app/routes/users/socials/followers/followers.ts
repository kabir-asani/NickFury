import { Router, Request, Response } from "express";
import { SessionsManager } from "../../../../../managers/sessionManager/sessionsManager";
import { SocialsManager } from "../../../../../managers/usersManager/socialsManager/socialsManager";
import { UsersManager } from "../../../../../managers/usersManager/usersManager";
import { InternalRouteFailure } from "../../../../core/types";

const followers = Router({
    mergeParams: true
});

followers.get(
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

export = followers;