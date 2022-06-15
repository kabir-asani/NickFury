import { Router, Request, Response } from "express";
import Joi from "joi";
import BookmarksManager from "../../../../managers/bookmarksManager/bookmarksManager";
import {
    BookmarkCreationFailureReason,
    BookmarkDeletionFailureReason,
    PaginatedViewableBookmarksFailureReason,
} from "../../../../managers/bookmarksManager/types";
import { kMaximumPaginatedPageLength } from "../../../../managers/core/types";
import { sentenceCasize } from "../../../../utils/caser/caser";
import { Failure } from "../../../../utils/typescriptx/typescriptx";
import { SessionizedRequest } from "../../../core/override";
import {
    AllOkRouteSuccess,
    ConflictRouteFailure,
    InternalRouteFailure,
    NoContentRouteSuccess,
    NoResourceRouteFailure,
    SemanticRouteFailure,
} from "../../../core/types";
import paginated from "../../../middlewares/paginated/paginated";
import selfishGuard from "../../../middlewares/selfieGuard/selfieGuard";
import soldier, { GroundZero } from "../../../middlewares/soldier/soldier";

const bookmarks = Router({
    mergeParams: true,
});

bookmarks.get("/", [selfishGuard(), paginated()], async (req: Request, res: Response) => {
    const session = (req as SessionizedRequest).session;

    const nextToken = req.query.nextToken as String;
    const limit = parseInt(req.query.limit as string);

    const safeLimit = isNaN(limit) ? kMaximumPaginatedPageLength : limit;

    const paginatedViewableBookmarksResult = await BookmarksManager.shared.paginatedViewableBookmarksOf({
        userId: session.userId,
        viewerId: session.userId,
        limit: safeLimit,
        nextToken: nextToken,
    });

    if (paginatedViewableBookmarksResult instanceof Failure) {
        const message = sentenceCasize(
            PaginatedViewableBookmarksFailureReason[paginatedViewableBookmarksResult.reason]
        );

        switch (paginatedViewableBookmarksResult.reason) {
            case PaginatedViewableBookmarksFailureReason.malformedParameters: {
                const response = new SemanticRouteFailure(message);

                res.status(SemanticRouteFailure.statusCode).json(response);

                return;
            }
            default: {
                const response = new InternalRouteFailure(message);

                res.status(InternalRouteFailure.statusCode).json(response);

                return;
            }
        }
    }

    const paginatedViewableBookmarks = paginatedViewableBookmarksResult.data;

    const response = new AllOkRouteSuccess(paginatedViewableBookmarks);

    res.status(AllOkRouteSuccess.statusCode).json(response);
});

bookmarks.post(
    "/",
    [
        selfishGuard(),
        soldier({
            schema: Joi.object({
                tweetId: Joi.string().required(),
            }),
            groundZero: GroundZero.body,
        }),
    ],
    async (req: Request, res: Response) => {
        const session = (req as SessionizedRequest).session;
        const parameters = req.body as {
            tweetId: String;
        };

        const bookmarkCreationResult = await BookmarksManager.shared.create({
            authorId: session.userId,
            tweetId: parameters.tweetId,
        });

        if (bookmarkCreationResult instanceof Failure) {
            const message = sentenceCasize(BookmarkCreationFailureReason[bookmarkCreationResult.reason]);

            switch (bookmarkCreationResult.reason) {
                case BookmarkCreationFailureReason.bookmarkAlreadyExists: {
                    const response = new ConflictRouteFailure(message);

                    res.status(ConflictRouteFailure.statusCode).json(response);

                    return;
                }
                default: {
                    const response = new InternalRouteFailure(message);

                    res.status(InternalRouteFailure.statusCode).json(response);

                    return;
                }
            }
        }

        const response = new NoContentRouteSuccess();

        res.status(NoContentRouteSuccess.statusCode).json(response);
    }
);

bookmarks.delete(
    "/",
    [
        selfishGuard(),
        soldier({
            schema: Joi.object({
                tweetId: Joi.string().required(),
            }),
            groundZero: GroundZero.query,
        }),
    ],
    async (req: Request, res: Response) => {
        const session = (req as SessionizedRequest).session;
        const tweetId = req.query.tweetId as String;

        const bookmarkDeletionResult = await BookmarksManager.shared.delete({
            authorId: session.userId,
            tweetId: tweetId,
        });

        if (bookmarkDeletionResult instanceof Failure) {
            const message = sentenceCasize(BookmarkDeletionFailureReason[bookmarkDeletionResult.reason]);

            switch (bookmarkDeletionResult.reason) {
                case BookmarkDeletionFailureReason.bookmarkDoesNotExists: {
                    const response = new NoResourceRouteFailure(message);

                    res.status(NoResourceRouteFailure.statusCode).json(response);

                    return;
                }
                default: {
                    const response = new InternalRouteFailure(message);

                    res.status(InternalRouteFailure.statusCode).json(response);

                    return;
                }
            }
        }

        const response = new NoContentRouteSuccess();

        res.status(NoContentRouteSuccess.statusCode).json(response);
    }
);

export default bookmarks;
