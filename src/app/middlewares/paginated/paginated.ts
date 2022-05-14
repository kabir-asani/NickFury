import Joi from "joi";
import { Paginated } from "../../../managers/core/types";
import { TxMiddleware } from "../core/types";
import { soldier, GroundZero } from "../soldier/soldier";

const paginated = (): TxMiddleware => soldier({
    schema: Joi.object({
        limit: Joi.number().max(Paginated.maximumPageLength),
        nextToken: Joi.string(),
    }).unknown(true),
    groundZero: GroundZero.query,
});

export = paginated;