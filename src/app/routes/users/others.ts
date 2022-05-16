import { Router, Request, Response } from "express";
import { ViewableUser } from "../../../managers/core/models";
import { UsersManager } from "../../../managers/usersManager/usersManager";
import { Failure } from "../../../utils/typescriptx/typescriptx";
import { SessionizedRequest } from "../../core/override";
import { AllOkRouteSuccess, InternalRouteFailure, UnimplementedRouteFailure } from "../../core/types";
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


        const viewableUser = await UsersManager.shared.user({
            id: userId,
            viewerId: session.userId
        });

        if (viewableUser !== null) {
            const response = new AllOkRouteSuccess(viewableUser);

            res
                .status(AllOkRouteSuccess.statusCode)
                .json(response);
        } else {
            const response = new InternalRouteFailure();

            res
                .status(InternalRouteFailure.statusCode)
                .json(response);
        }
    }
);

export = others;