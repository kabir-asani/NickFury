import { Request, Response, Router } from 'express';
import Joi from 'joi';
import { AuthManager } from '../../../managers/authManager/authManager';
import { authProvider, AuthProvider } from '../../../managers/authManager/models';
import { LogInFailureReason } from '../../../managers/authManager/types';
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
                provider: Joi.string().allow([
                    AuthProvider.apple,
                    AuthProvider.google,
                ])
            }),
            groundZero: GroundZero.body
        })
    ],
    async (req: Request, res: Response) => {
        const { accessToken, provider } = req.body;

        const logInResult = await AuthManager.shared().logIn({
            accessToken: accessToken as String,
            provider: authProvider(provider)!,
        });

        logInResult.resolve({
            onSuccess: (s) => {
                const routeResult = new RouteSuccess(s);

                res.status(201).json(routeResult);
            },
            onFailure: (f) => {
                const routeResult = new RouteSuccess('Something went wrong');

                res.status(501).json(routeResult);
            }
        });
    }
);


authentication.post(
    '/logOut',
    [
        ...gatekeeper()
    ],
    async (req: Request, res: Response) => {
        const { accessToken, provider } = req.body;

        const logOutResult = await AuthManager.shared().logOut({
            accessToken: accessToken as String,
        });

        logOutResult.resolve({
            onSuccess: (s) => {
                const routeResult = new RouteSuccess(s);

                res.status(201).json(routeResult);
            },
            onFailure: (f) => {
                const routeResult = new RouteSuccess('Something went wrong');

                res.status(501).json(routeResult);
            }
        });
    }
);

export = authentication;