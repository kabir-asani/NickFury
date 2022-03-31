import { Router, Request, Response } from "express";

const followers = Router({
    mergeParams: true
});


followers.get(
    "/",
    async (req: Request, res: Response) => {
        // TODO: Implement this route
        throw Error("Unimplemented");
    },
);

export = followers;