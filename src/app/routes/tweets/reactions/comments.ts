import { Router, Request, Response } from "express";
import Joi from "joi";
import CommentsManager from "../../../../managers/tweetsManager/commentsManager/commentsManager";
import {
    CommentDeletionFailureReason,
    PaginatedViewableCommentsFailureReason,
} from "../../../../managers/tweetsManager/commentsManager/types";
import { sentenceCasize } from "../../../../utils/caser/caser";
import { Failure } from "../../../../utils/typescriptx/typescriptx";
import { SessionizedRequest } from "../../../core/override";
import {
    AllOkRouteSuccess,
    InternalRouteFailure,
    NoContentRouteSuccess,
    NoResourceRouteFailure,
    SemanticRouteFailure,
} from "../../../core/types";
import paginated from "../../../middlewares/paginated/paginated";
import soldier, { GroundZero } from "../../../middlewares/soldier/soldier";

const comments = Router({
    mergeParams: true,
});

comments.get("/", paginated(), async (req: Request, res: Response) => {
    type NewType = SessionizedRequest;

    const session = (req as NewType).session;

    const tweetId = req.params.tweetId;

    const paginatedCommentsResult =
        await CommentsManager.shared.paginatedViewableCommentsOf({
            tweetId: tweetId,
            viewerId: session.userId,
        });

    if (paginatedCommentsResult instanceof Failure) {
        const message = sentenceCasize(
            PaginatedViewableCommentsFailureReason[
                paginatedCommentsResult.reason
            ]
        );

        switch (paginatedCommentsResult.reason) {
            case PaginatedViewableCommentsFailureReason.malformedParameters: {
                const response = new SemanticRouteFailure(message);

                res.status(SemanticRouteFailure.statusCode).json(response);

                return;
            }
            default: {
                const response = new InternalRouteFailure();

                res.status(InternalRouteFailure.statusCode).json(response);

                return;
            }
        }
    }

    const paginatedComments = paginatedCommentsResult.data;

    const response = new AllOkRouteSuccess(paginatedComments);

    res.status(AllOkRouteSuccess.statusCode).json(response);
});

comments.post(
    "/",
    soldier({
        schema: Joi.object({
            text: Joi.string().required().min(1).max(280),
        }),
        groundZero: GroundZero.body,
    }),
    async (req: Request, res: Response) => {
        const session = (req as SessionizedRequest).session;

        const tweetId = req.params.tweetId;

        const parameters = req.body as {
            text: String;
        };

        const commentCreationResult = await CommentsManager.shared.create({
            tweetId: tweetId,
            authorId: session.userId,
            comment: {
                text: parameters.text,
            },
        });

        if (commentCreationResult instanceof Failure) {
            const response = new InternalRouteFailure();

            res.status(InternalRouteFailure.statusCode).json(response);

            return;
        }

        const response = new NoContentRouteSuccess();

        res.status(NoContentRouteSuccess.statusCode).json(response);
    }
);

comments.delete("/:commentId", async (req: Request, res: Response) => {
    const commentId = req.params.commentId;

    const commentDeletionResult = await CommentsManager.shared.delete({
        commentId: commentId,
    });

    if (commentDeletionResult instanceof Failure) {
        const message = sentenceCasize(
            CommentDeletionFailureReason[commentDeletionResult.reason]
        );

        switch (commentDeletionResult.reason) {
            case CommentDeletionFailureReason.commentDoesNotExists: {
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
});

export default comments;
