import { Request, Response, Router } from 'express';
import Joi from 'joi';
import { AuthManager } from '../../../managers/authManager/authManager';
import { authProvider, AuthProvider } from '../../../managers/authManager/models';
import { LogInFailure } from '../../../managers/authManager/types';
import { Failure } from '../../../utils/typescriptx/typescriptx';
import { SessionizedRequest } from '../../core/override';
import { IncorrectArgumentsRouteFailure, InternalRouteFailure, NoContentRouteSuccess, OkRouteSuccess } from '../../core/types';
import { gatekeeper } from '../../middlewares/gatekeeper/gatekeeper';
import { GroundZero, soldier } from '../../middlewares/soldier/soldier';

const sessions = Router();

sessions.post(
    '/',
    soldier({
        schema: Joi.object({
            accessToken: Joi.string().required(),
            provider: Joi.string().valid(
                AuthProvider.apple.valueOf(),
                AuthProvider.google.valueOf(),
            ),
        }),
        groundZero: GroundZero.body,
    }),
    async (req: Request, res: Response) => {
        const { accessToken, provider } = req.body;

        const logInResult = await AuthManager.shared.logIn({
            accessToken: accessToken as String,
            provider: authProvider(provider)!,
        });

        if (logInResult instanceof Failure) {
            switch (logInResult.reason) {
                case LogInFailure.INCORRECT_AUTH_PROVIDER:
                case LogInFailure.INCORECT_ACCESS_TOKEN: {
                    const response = new IncorrectArgumentsRouteFailure();

                    res
                        .status(IncorrectArgumentsRouteFailure.statusCode)
                        .json(response);

                    return;
                }
                default: {
                    const response = new InternalRouteFailure();

                    res
                        .status(InternalRouteFailure.statusCode)
                        .json(response);

                    return;
                }
            }
        }

        const session = logInResult.data;
        const response = new OkRouteSuccess(session);

        res
            .status(OkRouteSuccess.statusCode)
            .json(response);

        return;
    },
);


sessions.delete(
    '/:sessionId',
    [
        ...gatekeeper(),
        soldier({
            schema: Joi.object({
                sessionId: Joi.string().required(),
            }),
            groundZero: GroundZero.parameters,
        }),
    ],
    async (req: Request, res: Response) => {
        const session = (req as SessionizedRequest).session;

        const logOutResult = await AuthManager.shared.logOut({
            sessionId: session.id,
        });

        if (logOutResult instanceof Failure) {
            const response = new InternalRouteFailure();

            res
                .status(InternalRouteFailure.statusCode)
                .json(response);
        }

        const response = new NoContentRouteSuccess();

        res
            .status(NoContentRouteSuccess.statusCode)
            .json(response);

        return;
    },
);

export = sessions;