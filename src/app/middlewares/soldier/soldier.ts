import { ObjectSchema, ValidationError } from "joi";
import { IncorrectParametersRouteFailure } from "../../core/types";
import TxMiddleware from "../core/types";

export enum GroundZero {
    parameters,
    query,
    headers,
    body,
}

const soldier =
    (parameters: {
        schema: ObjectSchema;
        groundZero: GroundZero;
    }): TxMiddleware =>
    async (req, res, next) => {
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

        const schema = (() => {
            switch (parameters.groundZero) {
                case GroundZero.parameters:
                    return parameters.schema.unknown(true);
                case GroundZero.query:
                    return parameters.schema.unknown(true);
                case GroundZero.headers:
                    return parameters.schema.unknown(true);
                case GroundZero.body:
                    return parameters.schema.unknown(false);
            }
        })();

        const validation = schema.validate(data);

        if (validation.error === null || validation.error === undefined) {
            next();
        } else {
            const details = (validation.error as ValidationError).details.map(
                (detail) => {
                    return {
                        message: detail.message,
                        path: detail.path,
                        type: detail.type,
                    };
                }
            );

            const failure = new IncorrectParametersRouteFailure(details);

            res.status(IncorrectParametersRouteFailure.statusCode).json(
                failure
            );
        }
    };

export default soldier;
