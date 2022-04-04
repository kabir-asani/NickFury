import { Router, Request, Response } from "express";
import Joi from "joi";
import { Paginated } from "../../../../managers/core/types";
import { LikesManager } from "../../../../managers/tweetsManager/likesManager/likesManager";
import { Like } from "../../../../managers/tweetsManager/likesManager/models";
import { AddLikeFailure, LikesFeedFailure } from "../../../../managers/tweetsManager/likesManager/types";
import { Failure } from "../../../../utils/typescriptx/typescriptx";
import { SessionizedRequest } from "../../../core/override";
import { InternalRouteFailure, NoResourceRouteFailure, OkRouteSuccess, SemanticRouteFailure } from "../../../core/types";
import paginated from "../../../middlewares/paginated/paginated";
import { GroundZero, soldier } from "../../../middlewares/soldier/soldier";

const likes = Router();

likes.get(
    '/',
    paginated(),
    async (req: Request, res: Response) => {
        const { tweetId } = req.params;

        const { nextToken, limit } = req.query;

        const likesFeedResult = await LikesManager.shared.likesList({
            tweetId: tweetId,
            limit: limit !== undefined ? Number(limit) : undefined,
            nextToken: nextToken !== undefined ? nextToken as unknown as String : undefined,
        });

        if (likesFeedResult instanceof Failure) {
            switch (likesFeedResult.reason) {
                case LikesFeedFailure.TWEET_DOES_NOT_EXISTS: {
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
        const paginatedLikes = new Paginated<Like>({
            page: likesFeedResult.data.page,
            nextToken: likesFeedResult.data.nextToken
        });

        const response = new OkRouteSuccess(paginatedLikes);

        res
            .status(OkRouteSuccess.statusCode)
            .json(response);
    }
);

likes.put(
    '/',
    async (req: Request, res: Response) => {
        const session = (req as SessionizedRequest).session;
        const { tweetId } = req.params;

        const addLikeResult = await LikesManager.shared.addLike({
            authorId: session.userId,
            tweetId: tweetId
        });

        if (addLikeResult instanceof Failure) {
            switch (addLikeResult.reason) {
                case AddLikeFailure.TWEET_DOES_NOT_EXISTS:
                case AddLikeFailure.LIKE_ALREADY_EXISTS: {
                    const response = new SemanticRouteFailure();

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

likes.delete(
    '/:lid',
    soldier({
        schema: Joi.object({
            lid: Joi.string().required(),
        }),
        groundZero: GroundZero.parameters,
    }),
    async (req: Request, res: Response) => {
        // TODO: Implement this route
        throw Error('Unimplemented');
    }
)

export = likes;