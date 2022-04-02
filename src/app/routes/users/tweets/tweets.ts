import { Router, Request, Response } from "express";
import Joi from "joi";
import paginated from "../../../middlewares/paginated/paginated";
import { GroundZero, soldier } from "../../../middlewares/soldier/soldier";
import likes from "./likes";

const tweets = Router({
    mergeParams: true
});

tweets.use(
    "/:tweetId/likes",
    likes
);

tweets.get(
    "/",
    paginated(),
    async (req: Request, res: Response) => {
        // TODO: Implement this route
        throw Error("Unimplemented");
    }
);

tweets.post(
    "/",
    soldier({
        schema: Joi.object({
            text: Joi.string().required().max(256),
        }),
        groundZero: GroundZero.body,
    }),
    async (req: Request, res: Response) => {
        // TODO: Implement this route
        throw Error("Unimplemented");
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
        // TODO: Implement this route
        throw Error("Unimplemented");
    }
)

export = tweets;