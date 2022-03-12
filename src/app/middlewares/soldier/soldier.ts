import Joi, { ObjectSchema, ValidationError } from "joi";
import { RouteFailure } from "../../core/types";
import { TxMiddleware } from "../core/types";

export enum GroundZero {
    parameters,
    query,
    headers,
    body
}

export const soldier = (parameters: {
    schema: ObjectSchema,
    groundZero: GroundZero
}): TxMiddleware => async (req, res, next) => {
    const schema = parameters.schema.unknown();

    const data = (() => {
        switch (parameters.groundZero) {
            case GroundZero.parameters:
                return req.params;
            case GroundZero.query:
                return req.query;
            case GroundZero.headers:
                return req.headers;
            case GroundZero.body:
                return req.body;
        }
    })();

    const validation = schema.validate(data);

    if (validation.error === null || validation.error === undefined) {
        next();
    } else {
        const details = (validation.error as ValidationError).details.map((detail) => detail.message);
        const failure = new RouteFailure(details);

        res.status(400).json(failure);
    }
};
