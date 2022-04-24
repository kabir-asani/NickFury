import { Request, Response, Router } from 'express';
import Joi from 'joi';
import { AuthenticationManager } from '../../../managers/authenticationManager/authenticationManager';
import { authProvider, AuthProvider } from '../../../managers/authenticationManager/models';
import { LogInFailure } from '../../../managers/authenticationManager/types';
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
            details: Joi.object({
                name: Joi.string().required(),
                email: Joi.string().email(),
                image: Joi.string().uri()
            }),
            credentials: Joi.object({
                token: Joi.string().required(),
                provider: Joi.string().valid(
                    AuthProvider.apple.valueOf(),
                    AuthProvider.google.valueOf(),
                ),
            }),
        }),
        groundZero: GroundZero.body,
    }),
    async (req: Request, res: Response) => {
        const { details, credentials } = req.body;

        const logInResult = await AuthenticationManager.shared.logIn({
            details: {
                name: details.name as String,
                email: details.email as String,
                image: details.image as String
            },
            credentials: {
                provider: authProvider(credentials.provider as String)!,
                token: credentials.token as String
            }
        });

        if (logInResult instanceof Failure) {
            switch (logInResult.reason) {
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

        const response = new OkRouteSuccess({
            accessToken: logInResult.data
        });

        res
            .status(OkRouteSuccess.statusCode)
            .json(response);

        return;
    },
);


sessions.delete(
    '/',
    ...gatekeeper(),
    async (req: Request, res: Response) => {
        const session = (req as SessionizedRequest).session;

        const logOutResult = await AuthenticationManager.shared.logOut({
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