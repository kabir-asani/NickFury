import { Request, Response, Router } from "express";
import Joi from "joi";
import { kMaximumPaginatedPageLength } from "../../../managers/core/types";
import UsersManager from "../../../managers/usersManager/usersManager";
import { Failure } from "../../../utils/typescriptx/typescriptx";
import { SessionizedRequest } from "../../core/override";
import { AllOkRouteSuccess, InternalRouteFailure } from "../../core/types";
import paginated from "../../middlewares/paginated/paginated";
import soldier, { GroundZero } from "../../middlewares/soldier/soldier";

const search = Router({
    mergeParams: true,
});

search.get(
    "/",
    [
        paginated(),
        soldier({
            schema: Joi.object({
                keyword: Joi.string().min(1).required(),
            }),
            groundZero: GroundZero.query,
        }),
    ],
    async (req: Request, res: Response) => {
        const session = (req as SessionizedRequest).session;
        const keyword = req.query.keyword as String;

        const nextToken = req.query.nextToken as String;
        const limit = parseInt(req.query.limit as string);

        const safeLimit = isNaN(limit) ? kMaximumPaginatedPageLength : limit;

        const searchResult = await UsersManager.shared.search({
            prefix: keyword,
            viewerId: session.userId,
            limit: safeLimit,
            nextToken: nextToken,
        });

        if (searchResult instanceof Failure) {
            const response = new InternalRouteFailure();

            res.status(InternalRouteFailure.statusCode).json(response);

            return;
        }

        const response = new AllOkRouteSuccess(searchResult.data);

        res.status(AllOkRouteSuccess.statusCode).json(response);
    }
);

export default search;
