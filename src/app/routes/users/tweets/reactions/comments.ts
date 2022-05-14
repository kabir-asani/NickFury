import { Router, Request, Response } from "express";
import Joi from "joi";
import { UnimplementedRouteFailure } from "../../../../core/types";
import paginated from "../../../../middlewares/paginated/paginated";
import { GroundZero, soldier } from "../../../../middlewares/soldier/soldier";

const comments = Router({
    mergeParams: true
});

comments.get(
    '/',
    paginated(),
    async (req: Request, res: Response) => {
        const response = new UnimplementedRouteFailure();

        res
            .status(UnimplementedRouteFailure.statusCode)
            .json(response);
    }
);

comments.post(
    '/',
    soldier({
        schema: Joi.object({
            text: Joi.string().required().min(1).max(280),
        }),
        groundZero: GroundZero.body,
    }),
    async (req: Request, res: Response) => {
        const response = new UnimplementedRouteFailure();

        res
            .status(UnimplementedRouteFailure.statusCode)
            .json(response);
    }
);

export = comments;