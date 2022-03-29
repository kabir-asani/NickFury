import Joi from "joi";
import { SessionsManager } from "../../../managers/sessionManager/sessionsManager";
import { IllegalAccessTokenRouteFailure, MissingAccessTokenRouteFailure, RouteFailure } from "../../core/types";
import { TxMiddleware } from "../core/types";
import { soldier, GroundZero } from "../soldier/soldier";

export const gatekeeper = (): TxMiddleware[] => [
    soldier({
        schema: Joi.object({
            authorization: Joi.string().required(),
        }),
        groundZero: GroundZero.headers
    }),
    async (req, res, next) => {
        const accessToken = req.headers.authorization;

        if (accessToken === undefined || accessToken === null) {
            const failure = new MissingAccessTokenRouteFailure();

            res
                .status(MissingAccessTokenRouteFailure.statusCode)
                .json(failure);

            return;
        }

        const isSesssionPresent = await SessionsManager.shared.exists({
            accessToken: accessToken,
        });

        if (!isSesssionPresent) {
            const failure = new IllegalAccessTokenRouteFailure();

            res
                .status(IllegalAccessTokenRouteFailure.statusCode)
                .json(failure);

            return;
        }

        next();
    }
];