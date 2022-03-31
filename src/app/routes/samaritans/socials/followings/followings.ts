import { Router, Request, Response } from "express";
import Joi from "joi";
import { GroundZero, soldier } from "../../../../middlewares/soldier/soldier";

const followings = Router({
    mergeParams: true
});


followings.get(
    "/",
    async (req: Request, res: Response) => {
        // TODO: Implement this route
        throw Error("Unimplemented");
    },
);

followings.put(
    "/",
    soldier({
        schema: Joi.object({
            samaritanId: Joi.string().required(),
        }),
        groundZero: GroundZero.body,
    }),
    async (req: Request, res: Response) => {
        // TODO: Implement this route
        throw Error("Unimplmented");
    },
);

followings.delete(
    "/",
    soldier({
        schema: Joi.object({
            samaritanId: Joi.string().required(),
        }),
        groundZero: GroundZero.body,
    }),
    async (req: Request, res: Response) => {
        // TODO: Implement this route
        throw Error("Unimplemented");
    }
)

export = followings;