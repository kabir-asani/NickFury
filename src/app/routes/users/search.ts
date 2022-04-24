import { Router } from "express";
import Joi from "joi";
import { Paginated } from "../../../managers/core/types";
import { ViewableUser } from "../../../managers/usersManager/models";
import { SearchUsersFailure } from "../../../managers/usersManager/types";
import { UsersManager } from "../../../managers/usersManager/usersManager";
import { ViewableUsersX } from "../../../managers/usersManager/viewables";
import { Failure } from "../../../utils/typescriptx/typescriptx";
import { SessionizedRequest } from "../../core/override";
import { IncorrectArgumentsRouteFailure, InternalRouteFailure, OkRouteSuccess } from "../../core/types";
import { soldier, GroundZero } from "../../middlewares/soldier/soldier";

const search = Router({
    mergeParams: true
});

search.get(
    "/",
    soldier({
        schema: Joi.object({
            keyword: Joi.string().required()
        }),
        groundZero: GroundZero.query
    }),
    async (req, res) => {
        const { session } = req as SessionizedRequest;

        const { where: keyword } = req.query;

        const paginateSearchResult = await UsersManager.shared.search({
            keyword: keyword as String
        });

        if (paginateSearchResult instanceof Failure) {
            switch (paginateSearchResult.reason) {
                case SearchUsersFailure.MALFORMED_KEYWORD: {
                    const response = new IncorrectArgumentsRouteFailure();

                    res
                        .status(IncorrectArgumentsRouteFailure.statusCode)
                        .json(response);

                    return;
                }
                default: {
                    const response = new InternalRouteFailure();

                    res
                        .status(InternalRouteFailure.statusCode)
                        .json(response);

                    return;
                }
            }
        }

        const paginatedUsers = paginateSearchResult.data;

        const viewablesUsersX = new ViewableUsersX({
            users: paginatedUsers.page
        });

        const viewableUsersResult = await viewablesUsersX.viewable({
            viewerId: session.userId
        });

        if (viewableUsersResult instanceof Failure) {
            switch (viewableUsersResult.reason) {
                default: {
                    const response = new InternalRouteFailure();

                    res
                        .status(InternalRouteFailure.statusCode)
                        .json(response);

                    return;
                }
            }
        }

        const paginatedViewableUsers = new Paginated<ViewableUser>({
            page: viewableUsersResult.data,
            nextToken: paginatedUsers.nextToken
        });


        const response = new OkRouteSuccess(paginatedViewableUsers);

        res
            .status(OkRouteSuccess.statusCode)
            .json(response);
    }
);

export = search;