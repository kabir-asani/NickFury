import Joi from "joi";
import { soldier, GroundZero } from "../soldier/soldier";

const paginated = () => soldier({
    schema: Joi.object({
        limit: Joi.number().max(100),
        nextToken: Joi.string(),
    }),
    groundZero: GroundZero.query,
});

export = paginated;