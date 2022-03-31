import {
    Router,
    Request,
    Response
} from "express";
import Joi from "joi";
import { SamaritansManager } from "../../../managers/samaritansManager/samaritansManager";
import { SessionsManager } from "../../../managers/sessionManager/sessionsManager";
import {
    MissingResourceRouteFailure,
    InternalRouteFailure
} from "../../core/types";
import {
    GroundZero,
    soldier
} from "../../middlewares/soldier/soldier";
import bookmarks from "./bookmarks/bookmarks";
import timeline from "./timeline/timeline";
import { SamaritanRouteSuccess } from "./types";
import followers from "./socials/followers/followers";
import followings from "./socials/followings/followings";

const samaritans = Router();

samaritans.use(
    "/followers",
    followers,
);

samaritans.use(
    "/followings",
    followings
);

samaritans.use(
    "/bookmarks",
    bookmarks,
);

samaritans.use(
    "/timeline",
    timeline,
);

samaritans.get(
    "/",
    async (req: Request, res: Response) => {
        const accessToken = req.headers.authorization;

        const session = await SessionsManager.shared.session({
            accessToken: accessToken
        });


        if (session === null) {
            const response = new InternalRouteFailure();
            res.status(500).json(response);

            return;
        }

        const sid = session.sid;

        const samaritan = await SamaritansManager.shared.samaritan({
            sid: sid
        });

        if (samaritan === null) {
            const response = new MissingResourceRouteFailure();

            res
                .status(MissingResourceRouteFailure.statusCode)
                .json(response);

            return;
        }

        const response = new SamaritanRouteSuccess(samaritan);

        res
            .status(SamaritanRouteSuccess.statusCode)
            .json(response);
    }
);

samaritans.patch(
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

samaritans.use(
    "/:sid/followers",
    followers,
);

samaritans.use(
    "/:sid/followings",
    followings,
);

samaritans.get(
    "/:sid",
    soldier({
        schema: Joi.object({
            sid: Joi.string().required(),
        }),
        groundZero: GroundZero.parameters
    }),
    async (req: Request, res: Response) => {
        const sid = req.params.sid as String;

        const samaritan = await SamaritansManager.shared.samaritan({
            sid: sid
        });

        if (samaritan === null) {
            const response = new MissingResourceRouteFailure();

            res
                .status(MissingResourceRouteFailure.statusCode)
                .json(response);

            return;
        }

        const response = new SamaritanRouteSuccess(samaritan);

        res
            .status(SamaritanRouteSuccess.statusCode)
            .json(response);
    }
);


export = samaritans;