import { Router } from "express";
import Joi from "joi";
import SelfManager from "../../../../managers/selfManager/selfManager";
import { SelfUpdationFailureReason } from "../../../../managers/selfManager/types";
import { sentenceCasize } from "../../../../utils/caser/caser";
import { Failure } from "../../../../utils/typescriptx/typescriptx";
import { SessionizedRequest } from "../../../core/override";
import {
    AllOkRouteSuccess,
    ConflictRouteFailure,
    InternalRouteFailure,
    NoResourceRouteFailure,
    SemanticRouteFailure,
} from "../../../core/types";
import soldier, { GroundZero } from "../../../middlewares/soldier/soldier";
import tweets from "../../tweets/tweets";
import bookmarks from "../bookmarks/bookmarks";
import followers from "../socials/followers/followers";
import followings from "../socials/followings/followings";
import timeline from "../timeline/timeline";

const self = Router({
    mergeParams: true,
});

self.use("/timeline", timeline);
self.use("/followers", followers);
self.use("/followings", followings);
self.use("/tweets", tweets);
self.use("/bookmarks", bookmarks);

self.get("/", async (req, res) => {
    const session = (req as SessionizedRequest).session;

    const selfUser = await SelfManager.shared.self({
        id: session.userId,
    });

    if (selfUser === null) {
        const response = new NoResourceRouteFailure();

        res.status(NoResourceRouteFailure.statusCode).json(response);

        return;
    }

    const response = new AllOkRouteSuccess(selfUser);

    res.status(AllOkRouteSuccess.statusCode).json(response);
});

self.patch(
    "/",
    soldier({
        schema: Joi.object({
            username: Joi.string().max(50).optional(),
            name: Joi.string().max(100).optional(),
            description: Joi.string().max(250).optional(),
            image: Joi.string().optional(),
        }),
        groundZero: GroundZero.body,
    }),
    async (req, res) => {
        const session = (req as SessionizedRequest).session;

        const parameters = req.body as {
            username?: String;
            name?: String;
            description?: String;
            image?: String;
        };

        const selfUpdationResult = await SelfManager.shared.update({
            id: session.userId,
            updates: {
                username: parameters.username,
                name: parameters.name,
                description: parameters.description,
                image: parameters.image,
            },
        });

        if (selfUpdationResult instanceof Failure) {
            const message = sentenceCasize(
                SelfUpdationFailureReason[selfUpdationResult.reason]
            );

            switch (selfUpdationResult.reason) {
                case SelfUpdationFailureReason.usernameUnavailable: {
                    const response = new ConflictRouteFailure(message);

                    res.status(ConflictRouteFailure.statusCode).json(response);

                    return;
                }
                default: {
                    const response = new InternalRouteFailure(message);

                    res.status(InternalRouteFailure.statusCode).json(response);

                    return;
                }
            }
        }

        const updatedUser = selfUpdationResult.data;

        const response = new AllOkRouteSuccess(updatedUser);

        res.status(AllOkRouteSuccess.statusCode).json(response);
    }
);

export default self;
