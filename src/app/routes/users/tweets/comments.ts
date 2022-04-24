import { Router, Request, Response } from "express";
import Joi from "joi";
import { Paginated } from "../../../../managers/core/types";
import { CommentsManager } from "../../../../managers/tweetsManager/commentsManager/commentsManager";
import { Comment } from "../../../../managers/tweetsManager/commentsManager/models";
import { CommentsFeedFailure, AddCommentFailure } from "../../../../managers/tweetsManager/commentsManager/types";
import { Failure } from "../../../../utils/typescriptx/typescriptx";
import { SessionizedRequest } from "../../../core/override";
import { InternalRouteFailure, NoResourceRouteFailure, OkRouteSuccess, SemanticRouteFailure } from "../../../core/types";
import paginated from "../../../middlewares/paginated/paginated";
import { GroundZero, soldier } from "../../../middlewares/soldier/soldier";

const comments = Router();

comments.get(
    '/',
    paginated(),
    async (req: Request, res: Response) => {
        const { tweetId } = req.params;

        const { nextToken, limit } = req.query;

        const commentsFeedResult = await CommentsManager.shared.commentsList({
            tweetId: tweetId,
            limit: limit !== undefined ? Number(limit) : undefined,
            nextToken: nextToken !== undefined ? nextToken as unknown as String : undefined,
        });

        if (commentsFeedResult instanceof Failure) {
            switch (commentsFeedResult.reason) {
                case CommentsFeedFailure.TWEET_DOES_NOT_EXISTS: {
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

        // TODO: Make viewable
        const paginatedLikes = new Paginated<Comment>({
            page: commentsFeedResult.data.page,
            nextToken: commentsFeedResult.data.nextToken
        });

        const response = new OkRouteSuccess(paginatedLikes);

        res
            .status(OkRouteSuccess.statusCode)
            .json(response);
    }
);

comments.put(
    '/',
    soldier({
        schema: Joi.object({
            text: Joi.string().required().min(1).max(280),
        }),
        groundZero: GroundZero.body,
    }),
    async (req: Request, res: Response) => {
        const session = (req as SessionizedRequest).session;
        const { tweetId } = req.params;
        const { text } = req.body;

        const addCommentResult = await CommentsManager.shared.addComment({
            authorId: session.userId,
            tweetId: tweetId,
            text: text,
        });

        if (addCommentResult instanceof Failure) {
            switch (addCommentResult.reason) {
                case AddCommentFailure.MALFORMED_COMMENT:
                case AddCommentFailure.TWEET_DOES_NOT_EXISTS: {
                    const response = new SemanticRouteFailure("like already exists on this ");

                    res
                        .status(SemanticRouteFailure.statusCode)
                        .json(response);

                    return;
                }
                default: {
                    const response = new InternalRouteFailure();

                    res
                        .status(InternalRouteFailure.statusCode)
                        .json(response);
                }
            }
        }
    }
);

comments.delete(
    '/:cid',
    soldier({
        schema: Joi.object({
            cid: Joi.string().required(),
        }),
        groundZero: GroundZero.parameters,
    }),
    async (req: Request, res: Response) => {
        // TODO: Implement this route
        throw Error('Unimplemented');
    }
)

export = comments;