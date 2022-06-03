import { Router, Request, Response } from "express";
import UsersManager from "../../../../managers/usersManager/usersManager";
import { SessionizedRequest } from "../../../core/override";
import { AllOkRouteSuccess, InternalRouteFailure } from "../../../core/types";
import followers from "../socials/followers/followers";
import followees from "../socials/followees/followees";
import tweets from "../../tweets/tweets";

const others = Router({
    mergeParams: true,
});

others.use("/followers", followers);
others.use("/followees", followees);
others.use("/tweets", tweets);

others.get("/", async (req: Request, res: Response) => {
    const session = (req as SessionizedRequest).session;

    const userId = req.params.userId as String;

    const viewableUser = await UsersManager.shared.viewableUser({
        id: userId,
        viewerId: session.userId,
    });

    if (viewableUser === null) {
        const response = new InternalRouteFailure();

        res.status(InternalRouteFailure.statusCode).json(response);

        return;
    }

    const response = new AllOkRouteSuccess(viewableUser);

    res.status(AllOkRouteSuccess.statusCode).json(response);
});

export default others;
