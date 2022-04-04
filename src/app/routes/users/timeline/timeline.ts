import { Router, Request, Response } from "express";
import { Paginated } from "../../../../managers/core/types";
import { Tweet } from "../../../../managers/tweetsManager/models";
import { TimelineManager } from "../../../../managers/usersManager/timelinesManager/timelineManager";
import { Failure } from "../../../../utils/typescriptx/typescriptx";
import { SessionizedRequest } from "../../../core/override";
import { InternalRouteFailure, OkRouteSuccess } from "../../../core/types";
import paginated from "../../../middlewares/paginated/paginated";
const timeline = Router();

timeline.get(
    "/",
    paginated(),
    async (req: Request, res: Response) => {
        const session = (req as SessionizedRequest).session;
        const { nextToken, limit } = req.query;

        const feedResult = await TimelineManager.shared.feed({
            userId: session.userId,
            limit: limit !== undefined ? limit as unknown as Number : undefined,
            nextToken: nextToken !== undefined ? nextToken as unknown as String : undefined,
        });

        if (feedResult instanceof Failure) {
            switch (feedResult.reason) {
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
        const paginatedFeed = new Paginated<Tweet>({
            page: feedResult.data.page,
            nextToken: feedResult.data.nextToken,
        });

        const response = new OkRouteSuccess(paginatedFeed);

        res
            .status(OkRouteSuccess.statusCode)
            .json(response);
    },
);

export = timeline;