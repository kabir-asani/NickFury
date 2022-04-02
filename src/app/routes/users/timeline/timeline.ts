import { Router, Request, Response } from "express";
import { SessionsManager } from "../../../../managers/sessionManager/sessionsManager";
import { TimelineManager } from "../../../../managers/usersManager/timelinesManager/timelineManager";
import { UsersManager } from "../../../../managers/usersManager/usersManager";
import { InternalRouteFailure, OkRouteSuccess } from "../../../core/types";
import paginated from "../../../middlewares/paginated/paginated";
const timeline = Router();

timeline.get(
    "/",
    paginated(),
    async (req: Request, res: Response) => {
        const { authorization: sessionId } = req.headers;
        const { nextToken, limit } = req.params;

        const session = await SessionsManager.shared.session({
            sessionId: sessionId as String,
        });

        if (session === null) {
            const response = new InternalRouteFailure();

            res
                .status(InternalRouteFailure.statusCode)
                .json(response);

            return;
        }

        const tweets = await TimelineManager.shared.tweets({
            userId: session.userId,
            limit: limit !== undefined ? limit as unknown as Number : undefined,
            nextToken: nextToken !== undefined ? nextToken as unknown as String : undefined,
        });

        if (tweets === null) {
            const response = new InternalRouteFailure();

            res
                .status(InternalRouteFailure.statusCode)
                .json(response);

            return;
        }

        // TODO: Enrich
        const response = new OkRouteSuccess(tweets);

        res
            .status(OkRouteSuccess.statusCode)
            .json(response);
    },
);

export = timeline;