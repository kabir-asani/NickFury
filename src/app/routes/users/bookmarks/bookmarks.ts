import { Router, Request, Response } from "express";
import Joi from "joi";
import { BookmarksManager } from "../../../../managers/bookmarksManager/bookmarksManager";
import { BookmarkCreationFailureReason, BookmarkDeletionFailureReason } from "../../../../managers/bookmarksManager/types";
import { kMaximumPaginatedPageLength } from "../../../../managers/core/types";
import { Failure } from "../../../../utils/typescriptx/typescriptx";
import { SessionizedRequest } from "../../../core/override";
import { AllOkRouteSuccess, InternalRouteFailure, NoContentRouteSuccess, NoResourceRouteFailure, SemanticRouteFailure } from "../../../core/types";
import paginated from "../../../middlewares/paginated/paginated";
import { selfishGuard } from "../../../middlewares/selfieGuard/selfieGuard";
import {
    GroundZero,
    soldier
} from "../../../middlewares/soldier/soldier";

const bookmarks = Router({
    mergeParams: true
});

bookmarks.get(
    "/",
    [
        selfishGuard(),
        paginated(),
    ],
    async (req: Request, res: Response) => {
        const session = (req as SessionizedRequest).session;

        const nextToken = req.params.nextToken;
        const limit = parseInt(req.params.limit);

        const safeLimit = isNaN(limit) ? kMaximumPaginatedPageLength : limit;

        const bookmarks = await BookmarksManager.shared.bookmarks({
            userId: session.userId,
            limit: safeLimit,
            nextToken: nextToken
        });

        if (bookmarks !== null) {
            const response = new AllOkRouteSuccess(bookmarks);

            res
                .status(AllOkRouteSuccess.statusCode)
                .json(response);
        } else {
            const response = new InternalRouteFailure();

            res
                .status(InternalRouteFailure.statusCode)
                .json(response);
        }
    },
);

bookmarks.post(
    "/",
    [
        selfishGuard(),
        soldier({
            schema: Joi.object({
                tweetId: Joi.string().required(),
            }),
            groundZero: GroundZero.body,
        })
    ],
    async (req: Request, res: Response) => {
        const session = (req as SessionizedRequest).session;
        const parameters = req.body as {
            tweetId: String;
        };

        const bookmarkCreation = await BookmarksManager.shared.create({
            authorId: session.userId,
            tweetId: parameters.tweetId
        });


        if (bookmarkCreation instanceof Failure) {
            switch (bookmarkCreation.reason) {
                case BookmarkCreationFailureReason.bookmarkAlreadyExists: {
                    const response = new SemanticRouteFailure("BOOKMARK_ALREADY_EXISTS");

                    res
                        .status(SemanticRouteFailure.statusCode)
                        .json(response);

                    break;
                }
                default: {
                    const response = new InternalRouteFailure();

                    res
                        .status(InternalRouteFailure.statusCode)
                        .json(response);

                    break;
                }
            }
        } else {
            const response = new NoContentRouteSuccess();

            res
                .status(NoContentRouteSuccess.statusCode)
                .json(response);
        }
    },
);

bookmarks.delete(
    "/:bookmarkId",
    [
        selfishGuard(),
        soldier({
            schema: Joi.object({
                bookmarkId: Joi.string().required(),
            }),
            groundZero: GroundZero.parameters,
        }),
    ],
    async (req: Request, res: Response) => {
        const bookmarkId = req.params.bookmarkId;

        const bookmarkDeletion = await BookmarksManager.shared.delete({
            bookmarkId: bookmarkId
        });

        if (bookmarkDeletion instanceof Failure) {
            switch (bookmarkDeletion.reason) {
                case BookmarkDeletionFailureReason.bookmarkDoesNotExists: {
                    const response = new NoResourceRouteFailure();

                    res
                        .status(NoResourceRouteFailure.statusCode)
                        .json(response);

                    break;
                }
                default: {
                    const response = new InternalRouteFailure();

                    res
                        .status(InternalRouteFailure.statusCode)
                        .json(response);

                    break;
                }
            }
        } else {
            const response = new NoContentRouteSuccess();

            res
                .status(NoContentRouteSuccess.statusCode)
                .json(response);
        }
    },
)

export = bookmarks;