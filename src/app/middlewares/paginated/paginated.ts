import Joi from "joi";
import { MAXIMUM_PAGINATED_PAGE_LENGTH, Paginated } from "../../../managers/core/types";
import { TxMiddleware } from "../core/types";
import { soldier, GroundZero } from "../soldier/soldier";

const paginated = (): TxMiddleware => soldier({
    schema: Joi.object({
        limit: Joi.number().max(MAXIMUM_PAGINATED_PAGE_LENGTH),
        nextToken: Joi.string(),
    }).unknown(true),
    groundZero: GroundZero.query,
});

export = paginated;