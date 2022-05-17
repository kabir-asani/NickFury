import { Router } from "express";
import Joi from "joi";
import { SelfManager } from "../../../../managers/selfManager/selfManager";
import { SelfUpdationFailureReason } from "../../../../managers/selfManager/types";
import { Failure } from "../../../../utils/typescriptx/typescriptx";
import { SessionizedRequest } from "../../../core/override";
import {
    AllOkRouteSuccess,
    NoResourceRouteFailure,
    SemanticRouteFailure,
    UnimplementedRouteFailure
} from "../../../core/types";
import { soldier, GroundZero } from "../../../middlewares/soldier/soldier";
import tweets from "../../tweets/tweets";
import bookmarks from "../bookmarks/bookmarks";
import followers from "../socials/followers/followers";
import followings from "../socials/followings/followings";
import timeline from "../timeline/timeline";


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
            const response = new AllOkRouteSuccess(user);

            res
                .status(AllOkRouteSuccess.statusCode)
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
            username: Joi.string().max(50),
            name: Joi.string().max(100),
            description: Joi.string().max(250),
            image: Joi.string(),
        }),
        groundZero: GroundZero.body
    }),
    async (req, res) => {
        const session = (req as SessionizedRequest).session;

        const parameters = req.body as {
            username?: String;
            name?: String;
            description?: String;
            image?: String;
        };

        const selfUpdation = await SelfManager.shared.update({
            id: session.userId,
            updates: {
                username: parameters.username,
                name: parameters.name,
                description: parameters.description,
                image: parameters.image
            }
        });

        if (selfUpdation instanceof Failure) {
            switch (selfUpdation.reason) {
                case SelfUpdationFailureReason.otherUserWithThatUsernameAlreadyExists: {
                    const response = new SemanticRouteFailure("That username is not available");

                    res
                        .status(SemanticRouteFailure.statusCode)
                        .json(response);

                    break;
                }

                default: {
                    const response = new UnimplementedRouteFailure();

                    res
                        .status(UnimplementedRouteFailure.statusCode)
                        .json(response);

                    break;
                }
            }
        } else {
            const updatedUser = selfUpdation.data;

            const response = new AllOkRouteSuccess(updatedUser);

            res
                .status(AllOkRouteSuccess.statusCode)
                .json(response);
        }

    }
);

export = self;