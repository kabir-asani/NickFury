import { Request, Response, Router } from 'express';
import Joi from 'joi';
import { AuthProvider } from '../../../managers/tokensManager/types';
import { UnimplementedRouteFailure } from '../../core/types';
import { gatekeeper } from '../../middlewares/gatekeeper/gatekeeper';
import { GroundZero, soldier } from '../../middlewares/soldier/soldier';

const tokens = Router();

tokens.post(
    '/',
    soldier({
        schema: Joi.object({
            credentials: Joi.object({
                token: Joi.string().required(),
                provider: Joi.string().valid(
                    AuthProvider.apple.valueOf(),
                    AuthProvider.google.valueOf()
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


tokens.delete(
    '/',
    gatekeeper(),
    async (req: Request, res: Response) => {
        const response = new UnimplementedRouteFailure();

        res
            .status(UnimplementedRouteFailure.statusCode)
            .json(response);
    },
);

export = tokens;