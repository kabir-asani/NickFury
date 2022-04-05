import { Router, Request, Response } from "express";
import Joi from "joi";
import { UsersManager } from "../../../managers/usersManager/usersManager";
import { ViewableUserX } from "../../../managers/usersManager/viewables";
import { Failure } from "../../../utils/typescriptx/typescriptx";
import { SessionizedRequest } from "../../core/override";
import { InternalRouteFailure, OkRouteSuccess } from "../../core/types";
import { soldier, GroundZero } from "../../middlewares/soldier/soldier";
import bookmarks from "./bookmarks/bookmarks";
import followers from "./socials/followers/followers";
import followings from "./socials/followings/followings";
import timeline from "./timeline/timeline";
import tweets from "./tweets/tweets";

const self = Router();

self.use("/followers", followers);
self.use("/followings", followings);
self.use("/tweets", tweets);
self.use("/bookmarks", bookmarks);
self.use("/timeline", timeline);

self.get(
    "/",
    async (req: Request, res: Response) => {
        const { session } = (req as SessionizedRequest);

        const userResult = await UsersManager.shared.user({
            userId: session.userId,
        });

        if (userResult instanceof Failure) {
            switch (userResult.reason) {
                default: {
                    const response = new InternalRouteFailure();

                    res
                        .status(InternalRouteFailure.statusCode)
                        .json(response);

                    return;
                }
            }
        }

        const user = userResult.data;

        const viewableUserX = new ViewableUserX({
            user: user
        });

        const viewableUserResult = await viewableUserX.viewable({
            viewerId: session.userId,
        });

        if (viewableUserResult instanceof Failure) {
            switch (viewableUserResult.reason) {
                default: {
                    const response = new InternalRouteFailure();

                    res
                        .status(InternalRouteFailure.statusCode)
                        .json(response);

                    return;
                }
            }
        }

        const viewableUser = viewableUserResult.data;

        const response = new OkRouteSuccess(viewableUser);

        res
            .status(OkRouteSuccess.statusCode)
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
        // TODO: Implement this route
        throw Error("Unimplemented");
    }
);

export = self;