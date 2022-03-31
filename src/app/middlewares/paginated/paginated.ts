import Joi from "joi";
import { TxMiddleware } from "../core/types";
import { soldier, GroundZero } from "../soldier/soldier";

const paginated = (): TxMiddleware => soldier({
    schema: Joi.object({
        limit: Joi.number().max(100),
        nextToken: Joi.string(),
    }),
    groundZero: GroundZero.query,
});

export = paginated;