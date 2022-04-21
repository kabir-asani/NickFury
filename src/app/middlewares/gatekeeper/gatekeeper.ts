import Joi from "joi";
import { Request, Response } from "express";
import { SessionsManager } from "../../../managers/sessionManager/sessionsManager";
import { InternalRouteFailure, UnauthenticatedRouteFailure } from "../../core/types";
import { TxMiddleware } from "../core/types";
import { soldier, GroundZero } from "../soldier/soldier";
import { SessionizedRequest } from "../../core/override";
import { Tokenizer } from "../../../utils/tokenizer/tokenizer";
import { Session } from "../../../managers/sessionManager/models";

export const gatekeeper = (): TxMiddleware[] => [
    soldier({
        schema: Joi.object({
            authorization: Joi.string().required(),
        }),
        groundZero: GroundZero.headers
    }),
    async (req: Request, res: Response, next) => {
        const accessToken = req.headers.authorization!;

        const token = accessToken.split('/')[1];

        const isValidToken = Tokenizer.shared.verify({
            token: token
        });

        if (!isValidToken) {
            const response = new UnauthenticatedRouteFailure();

            res
                .status(UnauthenticatedRouteFailure.statusCode)
                .json(response);

            return;
        }

        const session = Tokenizer.shared.payload<Session>({
            token: token
        });

        if (session === null) {
            const response = new InternalRouteFailure();

            res
                .status(InternalRouteFailure.statusCode)
                .json(response);

            return;
        }

        const isSessionExists = await SessionsManager.shared.exists({
            sessionId: session.id,
        });

        if (!isSessionExists) {
            const response = new UnauthenticatedRouteFailure();

            res
                .status(UnauthenticatedRouteFailure.statusCode)
                .json(response);

            return;
        }


        const sessionizedRequest = req as unknown as SessionizedRequest;
        sessionizedRequest.session = session;

        return next();
    }
];