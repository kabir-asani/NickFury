import { Router, Request, Response } from "express";
import { kMaximumPaginatedPageLength } from "../../../../managers/core/types";
import { TimelinesManager } from "../../../../managers/timelinesManager/timelinesManager";
import { SessionizedRequest } from "../../../core/override";
import { AllOkRouteSuccess, InternalRouteFailure, UnimplementedRouteFailure } from "../../../core/types";
import paginated from "../../../middlewares/paginated/paginated";
import { selfishGuard } from "../../../middlewares/selfieGuard/selfieGuard";

const timeline = Router({
    mergeParams: true
});

timeline.get(
    "/",
    [
        selfishGuard(),
        paginated(),
    ],
    async (req: Request, res: Response) => {
        const session = (req as SessionizedRequest).session;

        const nextToken = req.params.nextToken;
        const limit = parseInt(req.params.limit);

        const safeLimit = isNaN(limit) ? kMaximumPaginatedPageLength : limit;

        const timeline = await TimelinesManager.shared.timeline({
            userId: session.userId,
            nextToken: nextToken,
            limit: safeLimit
        });

        if (timeline !== null) {
            const response = new AllOkRouteSuccess(timeline);

            res
                .status(AllOkRouteSuccess.statusCode)
                .json(response);
        } else {
            const response = new InternalRouteFailure();

            res
                .status(InternalRouteFailure.statusCode)
                .json(response);
        }
    },
);

export = timeline;