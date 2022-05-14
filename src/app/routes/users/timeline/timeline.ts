import { Router, Request, Response } from "express";
import { UnimplementedRouteFailure } from "../../../core/types";
import paginated from "../../../middlewares/paginated/paginated";

const timeline = Router({
    mergeParams: true
});

timeline.get(
    "/",
    paginated(),
    async (req: Request, res: Response) => {
        const response = new UnimplementedRouteFailure();

        res
            .status(UnimplementedRouteFailure.statusCode)
            .json(response);
    },
);

export = timeline;