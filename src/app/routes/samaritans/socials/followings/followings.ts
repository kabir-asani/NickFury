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
            sid: Joi.string().required(),
        }),
        groundZero: GroundZero.body,
    }),
    async (req: Request, res: Response) => {
        // TODO: Implement this route
        throw Error("Unimplmented");
    },
);

followings.delete(
    "/:fid",
    soldier({
        schema: Joi.object({
            fid: Joi.string().required(),
        }),
        groundZero: GroundZero.parameters,
    }),
    async (req: Request, res: Response) => {
        // TODO: Implement this route
        throw Error("Unimplemented");
    }
)

export = followings;