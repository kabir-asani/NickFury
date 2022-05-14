import { Router, Request, Response } from "express";
import { UnimplementedRouteFailure } from "../../core/types";
import followers from "./socials/followers/followers";
import followings from "./socials/followings/followings";
import tweets from "./tweets/tweets";

const others = Router({
    mergeParams: true
});

others.use("/followers", followers);

others.use("/followings", followings);

others.use("/tweets", tweets);

others.get(
    "/",
    async (req: Request, res: Response) => {
        const response = new UnimplementedRouteFailure();

        res
            .status(UnimplementedRouteFailure.statusCode)
            .json(response);
    }
);

export = others;