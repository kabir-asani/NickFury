import { Request, Response, Router } from 'express';
import Joi from 'joi';
import { AuthManager } from '../../../managers/authManager/authManager';
import { authProvider, AuthProvider } from '../../../managers/authManager/models';
import { IncorrectAccessTokenFailure, LogInSuccess, LogOutSuccess } from '../../../managers/authManager/types';
import { IncorrectAccessTokenRouteFailure, InternalRouteFailure } from '../../core/types';
import { gatekeeper } from '../../middlewares/gatekeeper/gatekeeper';
import { GroundZero, soldier } from '../../middlewares/soldier/soldier';
import { LogInRouteSuccess, LogOutRouteSuccess } from './types';

const sessions = Router();

sessions.post(
    '/',
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

        const result = await AuthManager.shared.logIn({
            accessToken: accessToken as String,
            provider: authProvider(provider)!,
        });

        if (result instanceof LogInSuccess) {
            const session = result.session;
            const response = new LogInRouteSuccess(session);

            res
                .status(LogInRouteSuccess.statusCode)
                .json(response);

            return;
        }


        if (result instanceof IncorrectAccessTokenFailure) {
            const response = new IncorrectAccessTokenRouteFailure();

            res
                .status(IncorrectAccessTokenRouteFailure.statusCode)
                .json(response);

            return;
        }

        const response = new InternalRouteFailure();

        res
            .status(InternalRouteFailure.statusCode)
            .json(response);
    }
);


sessions.delete(
    '/',
    [
        ...gatekeeper()
    ],
    async (req: Request, res: Response) => {
        const { authorization: accessToken } = req.headers;

        const result = await AuthManager.shared.logOut({
            accessToken: accessToken as String,
        });

        if (result instanceof LogOutSuccess) {
            const response = new LogOutRouteSuccess();

            res
                .status(LogOutRouteSuccess.statusCode)
                .json(response);

            return;
        }

        const response = new InternalRouteFailure();

        res
            .status(InternalRouteFailure.statusCode)
            .json(response);
    }
);

export = sessions;