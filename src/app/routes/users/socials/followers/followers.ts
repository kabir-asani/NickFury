import { Router } from "express";
import { SocialsManager } from "../../../../../managers/socialsManager/socialsManager";
import { SessionizedRequest } from "../../../../core/override";
import {
    AllOkRouteSuccess,
    InternalRouteFailure
} from "../../../../core/types";
import paginated from "../../../../middlewares/paginated/paginated";

const followers = Router({
    mergeParams: true
});

followers.get(
    "/",
    paginated(),
    async (req, res) => {
        const session = (req as SessionizedRequest).session;

        const userId = req.params.userId;

        if (userId !== undefined && userId !== null) {
            const viewableFollowers = await SocialsManager.shared.viewableFollowers({
                userId: userId,
                viewerId: session.userId
            });

            if (viewableFollowers == null) {
                const response = new InternalRouteFailure();

                res
                    .status(InternalRouteFailure.statusCode)
                    .json(response);
            } else {
                const response = new AllOkRouteSuccess(viewableFollowers);

                res
                    .status(AllOkRouteSuccess.statusCode)
                    .json(response);
            }
        } else {
            const viewableFollowers = await SocialsManager.shared.viewableFollowers({
                userId: session.userId,
                viewerId: session.userId
            });

            if (viewableFollowers == null) {
                const response = new InternalRouteFailure();

                res
                    .status(InternalRouteFailure.statusCode)
                    .json(response);
            } else {
                const response = new AllOkRouteSuccess(viewableFollowers);

                res
                    .status(AllOkRouteSuccess.statusCode)
                    .json(response);
            }
        }
    },
);

export = followers;