import Joi from "joi";
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
        // TODO: Add a more complete implementation of GateKeeper with 
        // appropriate checks with DB.
        const isAuthentic = true;

        if (isAuthentic) {
            const failure = new RouteFailure("\"access-token\" is invalid");

            res.status(401).json(failure);
        } else {
            next();
        }
    }
];