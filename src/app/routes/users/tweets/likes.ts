import { Router, Request, Response } from "express";
import Joi from "joi";
import paginated from "../../../middlewares/paginated/paginated";
import { GroundZero, soldier } from "../../../middlewares/soldier/soldier";

const likes = Router();

likes.get(
    '/',
    paginated(),
    async (req: Request, res: Response) => {
        // TODO: Implement this route
        throw Error('Unimplemented');
    }
);

likes.post(
    '/',
    async (req: Request, res: Response) => {
        // TODO: Implement this route
        throw Error('Unimplemented');
    }
);

likes.delete(
    '/:lid',
    soldier({
        schema: Joi.object({
            lid: Joi.string().required(),
        }),
        groundZero: GroundZero.parameters,
    }),
    async (req: Request, res: Response) => {
        // TODO: Implement this route
        throw Error('Unimplemented');
    }
)

export = likes;