import { Router, Request, Response } from "express";
import Joi from "joi";
import { UnimplementedRouteFailure } from "../../../core/types";
import paginated from "../../../middlewares/paginated/paginated";
import {
    GroundZero,
    soldier
} from "../../../middlewares/soldier/soldier";

const bookmarks = Router({
    mergeParams: true
});

bookmarks.get(
    "/",
    paginated(),
    async (req: Request, res: Response) => {
        const response = new UnimplementedRouteFailure();

        res
            .status(UnimplementedRouteFailure.statusCode)
            .json(response);
    },
);

bookmarks.post(
    "/",
    soldier({
        schema: Joi.object({
            tweetId: Joi.string().required(),
        }),
        groundZero: GroundZero.body,
    }),
    async (req: Request, res: Response) => {
        const response = new UnimplementedRouteFailure();

        res
            .status(UnimplementedRouteFailure.statusCode)
            .json(response);
    },
);

bookmarks.delete(
    "/:bookmarkId",
    soldier({
        schema: Joi.object({
            bookmarkId: Joi.string().required(),
        }),
        groundZero: GroundZero.parameters,
    }),
    async (req: Request, res: Response) => {
        const response = new UnimplementedRouteFailure();

        res
            .status(UnimplementedRouteFailure.statusCode)
            .json(response);
    },
)

export = bookmarks;