import { Request, Response, Router } from 'express';
import Joi from 'joi';
import { SamaritansManager } from '../../../managers/samaritansManager/samaritansManager';
import { SessionsManager } from '../../../managers/sessionManager/sessionsManager';
import { TweetsManager } from '../../../managers/tweetsManager/tweetsManager';
import { MissingResourceRouteFailure, InternalRouteFailure } from '../../core/types';
import { gatekeeper } from '../../middlewares/gatekeeper/gatekeeper';
import { GroundZero, soldier } from '../../middlewares/soldier/soldier';
import { FeedRouteSuccess, SamaritanRouteSuccess } from './types';

const samaritans = Router();

samaritans.get('/me',
    [
        ...gatekeeper(),
    ],
    async (req: Request, res: Response) => {
        const accessToken = req.headers.authorization;

        const session = await SessionsManager.shared.session({
            accessToken: accessToken
        });


        if (session === null) {
            const response = new InternalRouteFailure();
            res.status(500).json(response);

            return;
        }

        const sid = session.sid;

        const samaritan = await SamaritansManager.shared.samaritan({
            sid: sid
        });

        if (samaritan === null) {
            const response = new MissingResourceRouteFailure();

            res
                .status(MissingResourceRouteFailure.statusCode)
                .json(response);

            return;
        }

        const response = new SamaritanRouteSuccess(samaritan);

        res
            .status(SamaritanRouteSuccess.statusCode)
            .json(response);
    }
);

samaritans.get(
    '/:sid',
    [
        ...gatekeeper(),
        soldier({
            schema: Joi.object({
                sid: Joi.string().required(),
            }),
            groundZero: GroundZero.parameters
        })
    ],
    async (req: Request, res: Response) => {
        const sid = req.params.sid as String;

        const samaritan = await SamaritansManager.shared.samaritan({
            sid: sid
        });

        if (samaritan === null) {
            const response = new MissingResourceRouteFailure();

            res
                .status(MissingResourceRouteFailure.statusCode)
                .json(response);

            return;
        }

        const response = new SamaritanRouteSuccess(samaritan);

        res
            .status(SamaritanRouteSuccess.statusCode)
            .json(response);
    }
);

samaritans.get(
    '/:sid/feed',
    [
        ...gatekeeper(),
        soldier({
            schema: Joi.object({
                sid: Joi.string().required(),
            }),
            groundZero: GroundZero.parameters
        }),
        soldier({
            schema: Joi.object({
                nextToken: Joi.string(),
                limit: Joi.number().max(100),
            }),
            groundZero: GroundZero.query
        })
    ],
    async (req: Request, res: Response) => {
        const sid = req.params.sid as String;
        const limit = req.query.limit;
        const nextToken = req.query.nextToken;

        const samaritan = await SamaritansManager.shared.samaritan({
            sid: sid
        });

        if (samaritan === null) {
            const response = new MissingResourceRouteFailure();

            res
                .status(MissingResourceRouteFailure.statusCode)
                .json(response);

            return;
        }

        const feed = await TweetsManager.shared.feed({
            sid: sid,
            limit: limit !== undefined || limit !== null
                ? limit as unknown as Number
                : undefined,
            nextToken: nextToken !== undefined || nextToken !== null
                ? nextToken as unknown as String
                : undefined,
        });

        if (feed !== null) {
            const response = new FeedRouteSuccess(feed);

            res
                .status(FeedRouteSuccess.statusCode)
                .json(response);

            return;
        }

        const response = new SamaritanRouteSuccess(samaritan);

        res
            .status(SamaritanRouteSuccess.statusCode)
            .json(response);
    }
);

export = samaritans;