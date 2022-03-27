import { Request, Response, Router } from 'express';
import Joi from 'joi';
import { SamaritansManager } from '../../../managers/samaritansManager/samaritansManager';
import { SessionsManager } from '../../../managers/sessionManager/sessionsManager';
import { RouteFailure, RouteSuccess } from '../../core/types';
import { gatekeeper } from '../../middlewares/gatekeeper/gatekeeper';
import { GroundZero, soldier } from '../../middlewares/soldier/soldier';

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
            const result = new RouteFailure("Something went wrong");
            res.status(500).json(result);

            return;
        }

        const sid = session.sid;

        const samaritan = await SamaritansManager.shared.samaritan({
            sid: sid
        });

        if (samaritan === null) {
            const result = new RouteFailure("Samaritan not found");
            res.status(404).json(result);

            return;
        }

        const result = new RouteSuccess(samaritan);

        res.status(200).json(result);
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
            const result = new RouteFailure("Samaritan not found");
            res.status(404).json(result);

            return;
        }

        const result = new RouteSuccess(samaritan);

        res.status(200).json(result);
    }
);

export = samaritans;