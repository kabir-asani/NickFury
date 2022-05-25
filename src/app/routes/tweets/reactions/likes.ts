import { Router, Request, Response } from "express";
import { kMaximumPaginatedPageLength } from "../../../../managers/core/types";
import { LikesManager } from "../../../../managers/tweetsManager/likesManager/likesManager";
import { LikeCreationFailureReason, LikeDeletionFailureReason } from "../../../../managers/tweetsManager/likesManager/types";
import { Failure } from "../../../../utils/typescriptx/typescriptx";
import { SessionizedRequest } from "../../../core/override";
import { AllOkRouteSuccess, CreationRouteSuccess, ForbiddenRouteFailure, InternalRouteFailure, SemanticRouteFailure } from "../../../core/types";
import paginated from "../../../middlewares/paginated/paginated";

const likes = Router({
    mergeParams: true
});

likes.get(
    '/',
    paginated(),
    async (req: Request, res: Response) => {
        const session = (req as SessionizedRequest).session;
        const tweetId = req.params.tweetId;
        const nextToken = req.params.nextToken;
        const limit = parseInt(req.params.limit);

        const safeLimit = isNaN(limit) ? kMaximumPaginatedPageLength : limit;

        const likes = await LikesManager.shared.likes({
            tweetId: tweetId,
            viewerId: session.userId,
            nextToken: nextToken,
            limit: safeLimit
        });

        if (likes === null) {
            const response = new InternalRouteFailure();

            res
                .status(InternalRouteFailure.statusCode)
                .json(response);
        } else {
            const response = new AllOkRouteSuccess(likes);


            res
                .status(AllOkRouteSuccess.statusCode)
                .json(response);
        }
    }
);

likes.post(
    '/',
    async (req: Request, res: Response) => {
        const session = (req as SessionizedRequest).session;
        const tweetId = req.params.tweetId;

        const likeCreation = await LikesManager.shared.create({
            authorId: session.userId,
            tweetId: tweetId
        });

        if (likeCreation instanceof Failure) {
            switch (likeCreation.reason) {
                case LikeCreationFailureReason.likeAlreadyExists: {
                    const response = new SemanticRouteFailure("LIKE_ALREADY_EXISTS");

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
            const response = new CreationRouteSuccess(likeCreation.data);

            res
                .status(CreationRouteSuccess.statusCode)
                .json(response);
        }
    }
);


likes.delete(
    '/:likeId',
    async (req: Request, res: Response) => {
        const session = (req as SessionizedRequest).session;
        const likeId = req.params.likeId;

        const like = await LikesManager.shared.like({
            likeId: likeId
        });

        if (like === null) {
            const response = new SemanticRouteFailure("LIKE_DOES_NOT_EXISTS");

            res
                .status(SemanticRouteFailure.statusCode)
                .json(response);
        } else {
            if (like.authorId !== session.userId) {
                const response = new ForbiddenRouteFailure();

                res
                    .status(ForbiddenRouteFailure.statusCode)
                    .json(response);
            } else {

                const likeDeletion = await LikesManager.shared.delete({
                    likeId: likeId
                });

                if (likeDeletion instanceof Failure) {
                    const response = new InternalRouteFailure();

                    res
                        .status(InternalRouteFailure.statusCode)
                        .json(response);
                } else {
                    const response = new CreationRouteSuccess(likeDeletion.data);

                    res
                        .status(CreationRouteSuccess.statusCode)
                        .json(response);
                }
            }
        }
    }
);

export = likes;