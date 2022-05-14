import { Request, Response, Router } from "express";
import Joi from "joi";
import { UnimplementedRouteFailure } from "../../core/types";
import paginated from "../../middlewares/paginated/paginated";
import { soldier, GroundZero } from "../../middlewares/soldier/soldier";

const search = Router({
    mergeParams: true
});

search.get(
    "/",
    [
        paginated(),
        soldier({
            schema: Joi.object({
                keyword: Joi.string().required()
            }).unknown(true),
            groundZero: GroundZero.query
        }),
    ],
    async (req: Request, res: Response) => {
        const response = new UnimplementedRouteFailure();

        res
            .status(UnimplementedRouteFailure.statusCode)
            .json(response);
    }
);

export = search;