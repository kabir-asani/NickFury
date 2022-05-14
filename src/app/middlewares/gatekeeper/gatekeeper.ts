import Joi from "joi";
import { Request, Response } from "express";
import { InternalRouteFailure, UnauthenticatedRouteFailure } from "../../core/types";
import { TxMiddleware } from "../core/types";
import { soldier, GroundZero } from "../soldier/soldier";
import { SessionizedRequest } from "../../core/override";
import { Tokenizer } from "../../../utils/tokenizer/tokenizer";

export const gatekeeper = (): TxMiddleware[] => [
    soldier({
        schema: Joi.object({
            authorization: Joi.string().required(),
        }),
        groundZero: GroundZero.headers
    }),
    async (req: Request, res: Response, next) => {
        const accessToken = req.headers.authorization! as String;

        if (accessToken.startsWith("Bearer ")) {

        } else {
            // TODO: Respond with 401
        }

        const bearerToken = accessToken.split(' ')[1];

        const sessionizedRequest = req as unknown as SessionizedRequest;
        sessionizedRequest.session = {
            sessionId: "", // TODO: Extract sessionId from token
            userId: "", // TODO: Extract userId from token
        };

        return next();
    }
];