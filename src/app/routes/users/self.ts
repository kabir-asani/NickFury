import { Router, Request, Response } from "express";
import Joi from "joi";
import { ViewableUser as User } from "../../../managers/core/models";
import { SelfManager } from "../../../managers/selfManager/selfManager";
import { UsersManager } from "../../../managers/usersManager/usersManager";
import { SessionizedRequest } from "../../core/override";
import { NoResourceRouteFailure, OkRouteSuccess, UnimplementedRouteFailure } from "../../core/types";
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
    async (req, res) => {
        const session = (req as SessionizedRequest).session;

        const user = await SelfManager.shared.self({
            id: session.userId
        });

        if (user !== null) {
            const response = new OkRouteSuccess(user);

            res
                .status(OkRouteSuccess.statusCode)
                .json(response);
        } else {
            const response = new NoResourceRouteFailure();

            res
                .status(NoResourceRouteFailure.statusCode)
                .json(response);
        }
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
    async (req, res) => {
        const response = new UnimplementedRouteFailure();

        res
            .status(UnimplementedRouteFailure.statusCode)
            .json(response);
    }
);

export = self;