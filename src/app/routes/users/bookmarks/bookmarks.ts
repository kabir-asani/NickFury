import { Router, Request, Response } from "express";
import Joi from "joi";
import { TweetsManager } from "../../../../managers/tweetsManager/tweetsManager";
import { BookmarksManager } from "../../../../managers/usersManager/bookmarksManager/bookmarksManager";
import { BookmarksFeedFailure, CreateBookmarkFailure, DeleteBookmarkFailure } from "../../../../managers/usersManager/bookmarksManager/types";
import { Failure } from "../../../../utils/typescriptx/typescriptx";
import { CreatedRouteSuccess, InternalRouteFailure, NoContentRouteSuccess, NoResourceRouteFailure, OkRouteSuccess, SemanticRouteFailure } from "../../../core/types";
import paginated from "../../../middlewares/paginated/paginated";
import {
    GroundZero,
    soldier
} from "../../../middlewares/soldier/soldier";
import { SessionizedRequest } from "../../../core/override";
import { Paginated } from "../../../../managers/core/types";
import { Bookmark } from "../../../../managers/usersManager/bookmarksManager/models";

const bookmarks = Router();

bookmarks.get(
    "/",
    paginated(),
    async (req: Request, res: Response) => {
        const session = (req as SessionizedRequest).session;
        const { nextToken, limit } = req.query;

        const bookmarksFeedResult = await BookmarksManager.shared.bookmarksFeed({
            authorId: session.userId,
            nextToken: nextToken !== undefined ? nextToken as String : undefined,
            limit: limit !== undefined ? limit as unknown as Number : undefined,
        });

        if (bookmarksFeedResult instanceof Failure) {
            switch (bookmarksFeedResult.reason) {
                default: {
                    const response = new InternalRouteFailure();

                    res
                        .status(InternalRouteFailure.statusCode)
                        .json(response);

                    return;
                }
            }

        }


        // TOOD: Make viewable
        const paginatedBookmarks = new Paginated<Bookmark>({
            page: bookmarksFeedResult.data.page,
            nextToken: bookmarksFeedResult.data.nextToken
        });

        const response = new OkRouteSuccess(paginatedBookmarks);

        res
            .status(OkRouteSuccess.statusCode)
            .json(response);
    },
);

bookmarks.post(
    "/",
    soldier({
        schema: Joi.object({
            tweetId: Joi.string(),
        }),
        groundZero: GroundZero.body,
    }),
    async (req: Request, res: Response) => {
        const { tweetId } = req.body;

        const session = (req as SessionizedRequest).session;

        const createBookmarkResult = await BookmarksManager.shared.createBookmark({
            authorId: session.userId,
            tweetId: tweetId
        });

        if (createBookmarkResult instanceof Failure) {
            switch (createBookmarkResult.reason) {
                case CreateBookmarkFailure.TWEET_DOES_NOT_EXISTS:
                case CreateBookmarkFailure.AUTHOR_DOES_NOT_EXISTS: {
                    const response = new NoResourceRouteFailure();

                    res
                        .status(NoResourceRouteFailure.statusCode)
                        .json(response);

                    return;
                }
                case CreateBookmarkFailure.BOOKMARK_ALREADY_EXISTS: {
                    const response = new SemanticRouteFailure();

                    res
                        .status(SemanticRouteFailure.statusCode)
                        .json(response);

                    return;
                }
                default:
                    const response = new InternalRouteFailure();

                    res
                        .status(InternalRouteFailure.statusCode)
                        .json(response);

                    return;
            }
        }

        const response = new CreatedRouteSuccess(createBookmarkResult.data);

        res
            .status(CreatedRouteSuccess.statusCode)
            .json(response);
    },
);

bookmarks.delete(
    "/:bookmarkId",
    soldier({
        schema: Joi.object({
            bookmarkId: Joi.string().required(),
        }),
        groundZero: GroundZero.parameters,
    }),
    async (req: Request, res: Response) => {
        const { bookmarkId } = req.body;

        const deleteBookmarkResult = await BookmarksManager.shared.deleteBookmark({
            bookmarkId: bookmarkId as String,
        });

        if (deleteBookmarkResult instanceof Failure) {
            switch (deleteBookmarkResult.reason) {
                case DeleteBookmarkFailure.BOOKMARK_DOES_NOT_EXISTS: {
                    const response = new NoResourceRouteFailure();

                    res
                        .status(NoResourceRouteFailure.statusCode)
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

        const response = new NoContentRouteSuccess();

        res
            .status(NoContentRouteSuccess.statusCode)
            .json(response);
    },
)

export = bookmarks;