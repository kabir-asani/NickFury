import { Request, Response, Router } from 'express';
import Joi from 'joi';
import { AuthManager } from '../../../managers/authManager/authManager';
import { authProvider, AuthProvider } from '../../../managers/authManager/models';
import { IllegalAccessTokenFailure, LogInSuccess, LogOutSuccess } from '../../../managers/authManager/types';
import { RouteFailure, RouteSuccess } from '../../core/types';
import { gatekeeper } from '../../middlewares/gatekeeper/gatekeeper';
import { GroundZero, soldier } from '../../middlewares/soldier/soldier';

const authentication = Router();

authentication.post(
    '/logIn',
    [
        soldier({
            schema: Joi.object({
                accessToken: Joi.string().required(),
                provider: Joi.string().valid(
                    AuthProvider.apple.valueOf(),
                    AuthProvider.google.valueOf(),
                ),
            }),
            groundZero: GroundZero.body
        })
    ],
    async (req: Request, res: Response) => {
        const { accessToken, provider } = req.body;

        const logInResult = await AuthManager.shared.logIn({
            accessToken: accessToken as String,
            provider: authProvider(provider)!,
        });

        if (logInResult instanceof LogInSuccess) {
            const session = logInResult.session;
            const result = new RouteSuccess(session);

            res.status(201).json(result);
            return;
        }


        if (logInResult instanceof IllegalAccessTokenFailure) {
            const result = new RouteFailure('Incorrect access token');
            res.status(400).json(result);
            return;
        }

        const result = new RouteFailure('Something went wrong');
        res.status(500).json(result);
    }
);


authentication.post(
    '/logOut',
    [
        ...gatekeeper()
    ],
    async (req: Request, res: Response) => {
        const { authorization: accessToken } = req.headers;

        const logOutResult = await AuthManager.shared.logOut({
            accessToken: accessToken as String,
        });

        if (logOutResult instanceof LogOutSuccess) {
            const result = new RouteSuccess('Successfully logged out');
            res.status(200).json(result);
            return;
        }

        const result = new RouteFailure('Something went wrong');
        res.status(500).json(result);
    }
);

export = authentication;