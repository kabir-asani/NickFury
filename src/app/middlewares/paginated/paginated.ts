import Joi from "joi";
import { kMaximumPaginatedPageLength } from "../../../managers/core/types";
import TxMiddleware from "../core/types";
import soldier, { GroundZero } from "../soldier/soldier";

const paginated = (): TxMiddleware =>
    soldier({
        schema: Joi.object({
            limit: Joi.number().max(kMaximumPaginatedPageLength).optional(),
            nextToken: Joi.string().optional(),
        }),
        groundZero: GroundZero.query,
    });

export default paginated;
