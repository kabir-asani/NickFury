import {
    Router,
    Request,
    Response
} from "express";
import Joi from "joi";
import { UsersManager } from "../../../managers/usersManager/usersManager";
import { SessionsManager } from "../../../managers/sessionManager/sessionsManager";
import {
    NoResourceRouteFailure,
    OkRouteSuccess,
    InternalRouteFailure
} from "../../core/types";
import {
    GroundZero,
    soldier
} from "../../middlewares/soldier/soldier";
import bookmarks from "./bookmarks/bookmarks";
import timeline from "./timeline/timeline";
import followers from "./socials/followers/followers";
import followings from "./socials/followings/followings";
import tweets from "../tweets/tweets";

const users = Router();

users.use(
    "/me/followers",
    followers,
);

users.use(
    "/me/followings",
    followings
);

users.use(
    "/me/bookmarks",
    bookmarks,
);

users.use(
    "/me/timeline",
    timeline,
);

users.get(
    "/me",
    async (req: Request, res: Response) => {
        const sessionId = req.headers.authorization;

        const session = await SessionsManager.shared.session({
            sessionId: sessionId as String,
        });


        if (session === null) {
            const response = new InternalRouteFailure();

            res
                .status(InternalRouteFailure.statusCode)
                .json(response);

            return;
        }

        const userId = session.userId;

        const user = await UsersManager.shared.user({
            userId: userId
        });

        if (user === null) {
            const response = new InternalRouteFailure();

            res
                .status(InternalRouteFailure.statusCode)
                .json(response);

            return;
        }

        const response = new OkRouteSuccess(user);

        res
            .status(OkRouteSuccess.statusCode)
            .json(response);
    }
);

users.patch(
    "/me",
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

users.use(
    "/:userId/followers",
    soldier({
        schema: Joi.object({
            userId: Joi.string().required(),
        }),
        groundZero: GroundZero.parameters,
    }),
    followers,
);

users.use(
    "/:userId/followings",
    soldier({
        schema: Joi.object({
            userId: Joi.string().required(),
        }),
        groundZero: GroundZero.parameters,
    }),
    followings,
);

users.get(
    "/:userId",
    soldier({
        schema: Joi.object({
            userId: Joi.string().required(),
        }),
        groundZero: GroundZero.parameters
    }),
    async (req: Request, res: Response) => {
        const userId = req.params.userId as String;

        const user = await UsersManager.shared.user({
            userId: userId
        });

        if (user === null) {
            const response = new NoResourceRouteFailure();

            res
                .status(NoResourceRouteFailure.statusCode)
                .json(response);

            return;
        }

        // TODO: Enrich
        const response = new OkRouteSuccess(user);

        res
            .status(OkRouteSuccess.statusCode)
            .json(response);
    }
);


export = users;