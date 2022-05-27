import { Router } from "express";
import SocialsManager from "../../../../../managers/socialsManager/socialsManager";
import { Failure } from "../../../../../utils/typescriptx/typescriptx";
import { SessionizedRequest } from "../../../../core/override";
import {
    AllOkRouteSuccess,
    InternalRouteFailure,
} from "../../../../core/types";
import paginated from "../../../../middlewares/paginated/paginated";

const followers = Router({
    mergeParams: true,
});

followers.get("/", paginated(), async (req, res) => {
    const session = (req as SessionizedRequest).session;

    const userId = req.params.userId || session.userId;

    const paginatedViewableFollowersResult =
        await SocialsManager.shared.paginatedViewableFollowers({
            userId: userId,
            viewerId: session.userId,
        });

    if (paginatedViewableFollowersResult instanceof Failure) {
        const response = new InternalRouteFailure();

        res.status(InternalRouteFailure.statusCode).json(response);

        return;
    }

    const paginatedViewableFollowers = paginatedViewableFollowersResult.data;

    const response = new AllOkRouteSuccess(paginatedViewableFollowers);

    res.status(AllOkRouteSuccess.statusCode).json(response);
});

export default followers;
