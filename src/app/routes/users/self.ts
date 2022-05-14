import { Router, Request, Response } from "express";
import Joi from "joi";
import { UnimplementedRouteFailure } from "../../core/types";
import { soldier, GroundZero } from "../../middlewares/soldier/soldier";
import bookmarks from "./bookmarks/bookmarks";
import followers from "./socials/followers/followers";
import followings from "./socials/followings/followings";
import timeline from "./timeline/timeline";
import tweets from "./tweets/tweets";

const self = Router({
    mergeParams: true
});

self.use("/timeline", timeline);
self.use("/followers", followers);
self.use("/followings", followings);
self.use("/tweets", tweets);
self.use("/bookmarks", bookmarks);

self.get(
    "/",
    async (req: Request, res: Response) => {
        const response = new UnimplementedRouteFailure();

        res
            .status(UnimplementedRouteFailure.statusCode)
            .json(response);
    }
);

self.patch(
    "/",
    soldier({
        schema: Joi.object({
            image: Joi.string(),
            description: Joi.string().max(250),
            name: Joi.string().max(100),
            username: Joi.string().max(50),
        }),
        groundZero: GroundZero.body
    }),
    async (req: Request, res: Response) => {
        const response = new UnimplementedRouteFailure();

        res
            .status(UnimplementedRouteFailure.statusCode)
            .json(response);
    }
);

export = self;