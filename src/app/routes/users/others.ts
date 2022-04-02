import { Router, Request, Response } from "express";
import Joi from "joi";
import { UserFailure } from "../../../managers/usersManager/types";
import { UsersManager } from "../../../managers/usersManager/usersManager";
import { Failure } from "../../../utils/typescriptx/typescriptx";
import { InternalRouteFailure, NoResourceRouteFailure, OkRouteSuccess } from "../../core/types";
import { soldier, GroundZero } from "../../middlewares/soldier/soldier";
import followers from "./socials/followers/followers";
import followings from "./socials/followings/followings";
import tweets from "./tweets/tweets";

const others = Router();

others.use(
    "/followers",
    soldier({
        schema: Joi.object({
            userId: Joi.string().required(),
        }),
        groundZero: GroundZero.parameters,
    }),
    followers,
);

others.use(
    "/followings",
    soldier({
        schema: Joi.object({
            userId: Joi.string().required(),
        }),
        groundZero: GroundZero.parameters,
    }),
    followings,
);

others.use(
    "/tweets",
    soldier({
        schema: Joi.object({
            userId: Joi.string().required(),
        }),
        groundZero: GroundZero.parameters,
    }),
    tweets,
);

others.get(
    "/",
    soldier({
        schema: Joi.object({
            userId: Joi.string().required(),
        }),
        groundZero: GroundZero.parameters
    }),
    async (req: Request, res: Response) => {
        const userId = req.params.userId as String;

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

        // TODO: Make viewable
        const user = userResult.data;

        const response = new OkRouteSuccess(user);

        res
            .status(OkRouteSuccess.statusCode)
            .json(response);
    }
);

export = others;