import { Router, Request, Response } from "express";
import { UsersManager } from "../../../managers/usersManager/usersManager";
import { SessionizedRequest } from "../../core/override";
import { AllOkRouteSuccess, UnimplementedRouteFailure } from "../../core/types";
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
        const session = (req as SessionizedRequest).session;

        const userId = req.params.userId as String;


        const user = await UsersManager.shared.user({
            id: userId
        });

        if (user !== null) {
            // TODO: Fetch and insert viewables

            const response = new AllOkRouteSuccess(user);

            res
                .status(AllOkRouteSuccess.statusCode)
                .json(response);
        } else {
            const response = new UnimplementedRouteFailure();

            res
                .status(UnimplementedRouteFailure.statusCode)
                .json(response);
        }
    }
);

export = others;