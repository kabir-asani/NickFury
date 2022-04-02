import { Router, Request, Response } from "express";
import Joi, { link } from "joi";
import { SessionsManager } from "../../../../managers/sessionManager/sessionsManager";
import { TweetsManager } from "../../../../managers/tweetsManager/tweetsManager";
import { BookmarksManager } from "../../../../managers/usersManager/bookmarksManager/bookmarksManager";
import { CreateBookmarkFailure, DeleteBookmarkFailure } from "../../../../managers/usersManager/bookmarksManager/types";
import { Failure, Success } from "../../../../utils/typescriptx/typescriptx";
import { CreatedRouteSuccess, InternalRouteFailure, NoContentRouteSuccess, NoResourceRouteFailure, OkRouteSuccess, SemanticRouteFailure } from "../../../core/types";
import paginated from "../../../middlewares/paginated/paginated";
import {
    GroundZero,
    soldier
} from "../../../middlewares/soldier/soldier";

const bookmarks = Router();

bookmarks.get(
    "/",
    paginated(),
    async (req: Request, res: Response) => {
        const { authorization: sessionId } = req.headers;

        const { nextToken, limit } = req.params;

        const session = await SessionsManager.shared.session({
            sessionId: sessionId as String,
        });

        if (session === null) {
            const response = new InternalRouteFailure();

            res
                .status(InternalRouteFailure.statusCode)
                .json(response);

            return;
        }

        const bookmarks = await BookmarksManager.shared.bookmarks({
            authorId: session.userId,
            nextToken: nextToken !== undefined ? nextToken as String : undefined,
            limit: limit !== undefined ? limit as unknown as Number : undefined,
        });

        if (bookmarks === null) {
            const response = new InternalRouteFailure();

            res
                .status(InternalRouteFailure.statusCode)
                .json(response);

            return;
        }

        // TOOD: Enrich
        const response = new OkRouteSuccess(bookmarks);

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
        const { authorization: sessionId } = req.headers;
        const { tweetId } = req.body;

        const session = await SessionsManager.shared.session({
            sessionId: sessionId as String,
        });

        if (session === null) {
            const response = new InternalRouteFailure();

            res
                .status(InternalRouteFailure.statusCode)
                .json(response);

            return;
        }

        const isTweetExists = await TweetsManager.shared.exits({
            tweetId: tweetId
        });

        if (!isTweetExists) {
            const response = new NoResourceRouteFailure();

            res
                .status(NoResourceRouteFailure.statusCode)
                .json(response);

            return;
        }

        const result = await BookmarksManager.shared.createBookmark({
            authorId: session.userId,
            tweetId: tweetId
        });

        if (result instanceof Failure) {
            if (result.reason === CreateBookmarkFailure.ALREADY_EXISTS) {
                const response = new SemanticRouteFailure();

                res
                    .status(SemanticRouteFailure.statusCode)
                    .json(response);
            }

            const response = new InternalRouteFailure();

            res
                .status(InternalRouteFailure.statusCode)
                .json(response);

            return;
        }

        const response = new CreatedRouteSuccess(result.data);

        res
            .status(CreatedRouteSuccess.statusCode)
            .json(response);
    },
);

bookmarks.delete(
    "/",
    soldier({
        schema: Joi.object({
            bookmarkId: Joi.string().required(),
        }),
        groundZero: GroundZero.query,
    }),
    async (req: Request, res: Response) => {
        const { authorization: sessionId } = req.headers;
        const { bookmarkId } = req.body;

        const session = await SessionsManager.shared.session({
            sessionId: sessionId as String,
        });

        if (session === null) {
            const response = new InternalRouteFailure();

            res
                .status(InternalRouteFailure.statusCode)
                .json(response);

            return;
        }

        const result = await BookmarksManager.shared.deleteBookmark({
            authorId: session.userId,
            bookmarkId: bookmarkId as String,
        });

        if (result instanceof Failure) {
            switch (result.reason) {
                case DeleteBookmarkFailure.DOES_NOT_EXISTS: {
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