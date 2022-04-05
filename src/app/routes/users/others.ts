import { Router, Request, Response } from "express";
import Joi from "joi";
import { UserFailure } from "../../../managers/usersManager/types";
import { UsersManager } from "../../../managers/usersManager/usersManager";
import { ViewableUserX } from "../../../managers/usersManager/viewables";
import { Failure } from "../../../utils/typescriptx/typescriptx";
import { SessionizedRequest } from "../../core/override";
import { InternalRouteFailure, NoResourceRouteFailure, OkRouteSuccess } from "../../core/types";
import { soldier, GroundZero } from "../../middlewares/soldier/soldier";
import followers from "./socials/followers/followers";
import followings from "./socials/followings/followings";
import tweets from "./tweets/tweets";

const others = Router();

others.use("/followers", followers);

others.use("/followings", followings);

others.use("/tweets", tweets);

others.get(
    "/",
    soldier({
        schema: Joi.object({
            userId: Joi.string().required(),
        }),
        groundZero: GroundZero.parameters
    }),
    async (req: Request, res: Response) => {
        const { session } = (req as SessionizedRequest);

        const { userId } = req.params;

        const userResult = await UsersManager.shared.user({
            userId: userId
        });

        if (userResult instanceof Failure) {
            switch (userResult.reason) {
                case UserFailure.USER_DOES_NOT_EXISTS: {
                    const response = new NoResourceRouteFailure();

                    res
                        .status(NoResourceRouteFailure.statusCode)
                        .json(response);

                    return;
                }
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
            viewerId: session.userId
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

export = others;