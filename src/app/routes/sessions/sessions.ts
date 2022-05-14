import { Request, Response, Router } from 'express';
import Joi from 'joi';
import { UnimplementedRouteFailure } from '../../core/types';
import { gatekeeper } from '../../middlewares/gatekeeper/gatekeeper';
import { GroundZero, soldier } from '../../middlewares/soldier/soldier';

const sessions = Router();

sessions.post(
    '/',
    soldier({
        schema: Joi.object({
            credentials: Joi.object({
                token: Joi.string().required(),
                provider: Joi.string().valid(
                    // TODO: Use enum for this
                    "apple",
                    "google"
                ),
            }),
            details: Joi.object({
                name: Joi.string().required(),
                email: Joi.string().required().email(),
                image: Joi.string().required().uri()
            }),
        }),
        groundZero: GroundZero.body,
    }),
    async (req: Request, res: Response) => {
        const response = new UnimplementedRouteFailure();

        res
            .status(UnimplementedRouteFailure.statusCode)
            .json(response);
    },
);


sessions.delete(
    '/',
    ...gatekeeper(),
    async (req: Request, res: Response) => {
        const response = new UnimplementedRouteFailure();

        res
            .status(UnimplementedRouteFailure.statusCode)
            .json(response);
    },
);

export = sessions;