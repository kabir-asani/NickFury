import { Failure, Success } from "../../../utils/typescriptx/typescriptx";
import { UsersManager } from "../../usersManager/usersManager";
import { ViewableUserX } from "../../usersManager/viewables";
import { Like, ViewableLike } from "./models";
import { ViewableLikeFailure } from "./types";

class ViewableLikeX {
    private like: Like;

    constructor(parameters: {
        like: Like;
    }) {
        this.like = parameters.like;
    }

    async viewable(parameters: {
        viewerId: String;
        options?: {
            enableViewerCheck?: Boolean;
        };
    }): Promise<Success<ViewableLike> | Failure<ViewableLikeFailure>> {
        if (parameters.options?.enableViewerCheck === true) {
            const isViewerExists = await UsersManager.shared.exists({
                userId: parameters.viewerId
            });

            if (!isViewerExists) {
                const result = new Failure<ViewableLikeFailure>(ViewableLikeFailure.VIEWER_DOES_NOT_EXISTS);
                return result;
            }
        }

        const authorResult = await UsersManager.shared.user({
            userId: this.like.authorId
        });

        if (authorResult instanceof Failure) {
            switch (authorResult.reason) {
                default:
                    const result = new Failure<ViewableLikeFailure>(ViewableLikeFailure.UNKNOWN);
                    return result;
            }
        }

        const author = authorResult.data;
        const viewableAuthorX = new ViewableUserX({
            user: author
        });

        const viewAuthorResult = await viewableAuthorX.viewable({
            viewerId: parameters.viewerId
        });

        if (viewAuthorResult instanceof Failure) {
            switch (viewAuthorResult.reason) {
                default:
                    const result = new Failure<ViewableLikeFailure>(ViewableLikeFailure.UNKNOWN);
                    return result;
            }
        }

        const viewableAuthor = viewAuthorResult.data;

        const viewableLike: ViewableLike = {
            ...this.like,
            author: viewableAuthor
        };

        const result = new Success<ViewableLike>(viewableLike);
        return result;
    }
}


class ViewableLikesX {
    private likes: Like[];

    constructor(parameters: {
        likes: Like[];
    }) {
        this.likes = parameters.likes;
    }

    async viewable(parameters: {
        viewerId: String;
        options?: {
            enableViewerCheck?: Boolean;
        };
    }): Promise<Success<ViewableLike[]> | Failure<ViewableLikeFailure>> {
        if (parameters.options?.enableViewerCheck === true) {
            const isViewerExists = await UsersManager.shared.exists({
                userId: parameters.viewerId
            });

            if (!isViewerExists) {
                const result = new Failure<ViewableLikeFailure>(ViewableLikeFailure.VIEWER_DOES_NOT_EXISTS);
                return result;
            }
        }

        const viewableLikes: ViewableLike[] = [];

        for (const like of this.likes) {
            const viewableLikeX = new ViewableLikeX({
                like: like
            });

            const viewableLikeResult = await viewableLikeX.viewable({
                viewerId: parameters.viewerId,
            });

            if (viewableLikeResult instanceof Failure) {
                return viewableLikeResult;
            }

            const viewableLike = viewableLikeResult.data;
            viewableLikes.push(viewableLike);
        }

        const result = new Success<ViewableLike[]>(viewableLikes);
        return result;
    }
}