import Joi from "joi";
import { Request, Response } from "express";
import { SessionsManager } from "../../../managers/sessionsManager/sessionsManager";
import { InternalRouteFailure, UnauthenticatedRouteFailure } from "../../core/types";
import { TxMiddleware } from "../core/types";
import { soldier, GroundZero } from "../soldier/soldier";
import { SessionizedRequest } from "../../core/override";
import { Tokenizer } from "../../../utils/tokenizer/tokenizer";
import { Session } from "../../../managers/sessionsManager/models";

export const gatekeeper = (): TxMiddleware[] => [
    soldier({
        schema: Joi.object({
            authorization: Joi.string().required(),
        }),
        groundZero: GroundZero.headers
    }),
    async (req: Request, res: Response, next) => {
        const accessToken = req.headers.authorization!;

        const token = accessToken.split(' ')[1];

        const isValidToken = Tokenizer.shared.verify({
            token: token
        });

        if (!isValidToken) {
            console.log(`Token: ${token} is invalid`);

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
            console.log(`Token: ${token} could not be decoded`);

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
            console.log(`Session: ${session} doesn't exists on database`);

            const response = new UnauthenticatedRouteFailure();

            res
                .status(UnauthenticatedRouteFailure.statusCode)
                .json(response);

            return;
        }

        const sessionizedRequest = req as unknown as SessionizedRequest;
        sessionizedRequest.session = {
            id: session.id,
            userId: session.userId,
        };

        return next();
    }
];