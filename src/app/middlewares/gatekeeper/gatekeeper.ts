import Joi from "joi";
import { Request, Response } from "express";
import { SessionsManager } from "../../../managers/sessionManager/sessionsManager";
import { SessionFailure } from "../../../managers/sessionManager/types";
import { Failure } from "../../../utils/typescriptx/typescriptx";
import { InternalRouteFailure, UnauthenticatedRouteFailure } from "../../core/types";
import { TxMiddleware } from "../core/types";
import { soldier, GroundZero } from "../soldier/soldier";
import { SessionizedRequest } from "../../core/override";

export const gatekeeper = (): TxMiddleware[] => [
    soldier({
        schema: Joi.object({
            authorization: Joi.string().required(),
        }),
        groundZero: GroundZero.headers
    }),
    async (req: Request, res: Response, next) => {
        const sessionId = req.headers.authorization;

        const sessionResult = await SessionsManager.shared.session({
            sessionId: sessionId as String,
        });

        if (sessionResult instanceof Failure) {
            switch (sessionResult.reason) {
                case SessionFailure.SESSION_DOES_NOT_EXISTS: {
                    const response = new UnauthenticatedRouteFailure();

                    res
                        .status(UnauthenticatedRouteFailure.statusCode)
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

        const sessionizedRequest = req as unknown as SessionizedRequest;
        sessionizedRequest.session = sessionResult.data;

        return next();
    }
];