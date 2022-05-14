import { Router, Request, Response } from "express";
import Joi from "joi";
import { UnimplementedRouteFailure } from "../../../core/types";
import paginated from "../../../middlewares/paginated/paginated";
import { GroundZero, soldier } from "../../../middlewares/soldier/soldier";
import comments from "./reactions/comments";
import likes from "./reactions/likes";

const tweets = Router({
    mergeParams: true
});

tweets.use(
    "/:tweetId/likes",
    likes
);

tweets.use(
    "/:tweetId/comments",
    comments
)

tweets.get(
    "/",
    paginated(),
    async (req: Request, res: Response) => {
        const response = new UnimplementedRouteFailure();

        res
            .status(UnimplementedRouteFailure.statusCode)
            .json(response);
    }
);

tweets.post(
    "/",
    soldier({
        schema: Joi.object({
            text: Joi.string().required().max(256).min(1),
        }),
        groundZero: GroundZero.body,
    }),
    async (req: Request, res: Response) => {
        const response = new UnimplementedRouteFailure();

        res
            .status(UnimplementedRouteFailure.statusCode)
            .json(response);
    }
);

tweets.delete(
    "/:tweetId",
    soldier({
        schema: Joi.object({
            tweetId: Joi.string().required(),
        }),
        groundZero: GroundZero.parameters
    }),
    async (req: Request, res: Response) => {
        const response = new UnimplementedRouteFailure();

        res
            .status(UnimplementedRouteFailure.statusCode)
            .json(response);
    }
)

export = tweets;