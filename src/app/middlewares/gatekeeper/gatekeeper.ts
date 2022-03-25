import Joi from "joi";
import { SessionsManager } from "../../../managers/sessionManager/sessionsManager";
import { RouteFailure } from "../../core/types";
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
        if (req.headers.authorization === undefined || req.headers.authorization === null) {
            const failure = new RouteFailure("\"access-token\" is missing");

            res.status(401).json(failure);
            return;
        }

        const accessToken = (req.headers["Authorization"] || req.headers["authorization"]) as String;

        const isSesssionPresent = await SessionsManager.shared.exists({
            accessToken: accessToken,
        });

        if (!isSesssionPresent) {
            const failure = new RouteFailure("Illegal access token");

            res.status(401).json(failure);
            return;
        }

        next();
    }
];