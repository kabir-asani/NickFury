import Joi from "joi";
import { SessionsManager } from "../../../managers/sessionManager/sessionsManager";
import { IncorrectArgumentsRouteFailure, UnauthenticatedRouteFailure } from "../../core/types";
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
        const sessionId = req.headers.authorization;

        const isSesssionPresent = await SessionsManager.shared.exists({
            sessionId: sessionId as String,
        });

        if (!isSesssionPresent) {
            const failure = new UnauthenticatedRouteFailure();

            res
                .status(UnauthenticatedRouteFailure.statusCode)
                .json(failure);

            return;
        }

        next();
    }
];