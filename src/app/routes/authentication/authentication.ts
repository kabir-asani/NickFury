import { Request, Response, Router } from 'express';
import Joi from 'joi';
import { RouteFailure } from '../../core/types';
import { gatekeeper } from '../../middlewares/gatekeeper/gatekeeper';
import { GroundZero, soldier } from '../../middlewares/soldier/soldier';

const authentication = Router();

authentication.post('/logIn',
    [
        soldier({
            schema: Joi.object({
                accessToken: Joi.string().required(),
            }),
            groundZero: GroundZero.body
        })
    ],
    (req: Request, res: Response) => {
        const failure = new RouteFailure('This route is currently under construction');

        res.status(501).json(failure);
    });


authentication.post(
    '/logOut',
    [...gatekeeper()],
    (req: Request, res: Response) => {
        const failure = new RouteFailure('This route is currently under construction');

        res.status(501).json(failure);
    }
);

export = authentication;