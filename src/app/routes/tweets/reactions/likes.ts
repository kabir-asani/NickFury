import { Router, Request, Response } from "express";
import LikesManager from "../../../../managers/tweetsManager/likesManager/likesManager";
import {
    LikeCreationFailureReason,
    LikeDeletionFailureReason,
    PaginatedViewableLikesFailureReason,
} from "../../../../managers/tweetsManager/likesManager/types";
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

const likes = Router({
    mergeParams: true,
});

likes.get("/", paginated(), async (req: Request, res: Response) => {
    const session = (req as SessionizedRequest).session;

    const tweetId = req.params.tweetId;

    const paginatedLikesResult =
        await LikesManager.shared.paginatedViewableLikesOf({
            tweetId: tweetId,
            viewerId: session.userId,
        });

    if (paginatedLikesResult instanceof Failure) {
        const message = sentenceCasize(
            PaginatedViewableLikesFailureReason[paginatedLikesResult.reason]
        );

        switch (paginatedLikesResult.reason) {
            case PaginatedViewableLikesFailureReason.malformedParameters: {
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

    const paginatedLikes = paginatedLikesResult.data;

    const response = new AllOkRouteSuccess(paginatedLikes);

    res.status(AllOkRouteSuccess.statusCode).json(response);
});

likes.post("/", async (req: Request, res: Response) => {
    const session = (req as SessionizedRequest).session;

    const tweetId = req.params.tweetId;

    const likeCreationResult = await LikesManager.shared.create({
        tweetId: tweetId,
        authorId: session.userId,
    });

    if (likeCreationResult instanceof Failure) {
        const message = sentenceCasize(
            LikeCreationFailureReason[likeCreationResult.reason]
        );

        switch (likeCreationResult.reason) {
            case LikeCreationFailureReason.likeAlreadyExists: {
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
});

likes.delete("/:likeId", async (req: Request, res: Response) => {
    const likeId = req.params.likeId;

    const likeDeletionResult = await LikesManager.shared.delete({
        likeId: likeId,
    });

    if (likeDeletionResult instanceof Failure) {
        const message = sentenceCasize(
            LikeDeletionFailureReason[likeDeletionResult.reason]
        );

        switch (likeDeletionResult.reason) {
            case LikeDeletionFailureReason.likeDoesNotExists: {
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

export default likes;
