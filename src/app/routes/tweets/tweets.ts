import { Router, Request, Response } from "express";
import Joi from "joi";
import paginated from "../../middlewares/paginated/paginated";
import { GroundZero, soldier } from "../../middlewares/soldier/soldier";
import likes from "./likes";

const tweets = Router({
    mergeParams: true
});


// Tag alone the "likes" sub-resource
tweets.use(
    "/likes",
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

tweets.get(
    "/:tid",
    async (req: Request, res: Response) => {
        // TODO: Implement this route
        throw Error("Unimplemented");
    }
);

tweets.delete(
    "/:tid",
    async (req: Request, res: Response) => {
        // TODO: Implement this route
        throw Error("Unimplemented");
    }
);

export = tweets;