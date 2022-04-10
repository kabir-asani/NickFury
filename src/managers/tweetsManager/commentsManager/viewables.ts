import { Failure, Success } from "../../../utils/typescriptx/typescriptx";
import { UsersManager } from "../../usersManager/usersManager";
import { ViewableUserX } from "../../usersManager/viewables";
import { Comment, ViewableComment } from "./models";
import { ViewableCommentFailure } from "./types";

class ViewableCommentX {
    private comment: Comment;

    constructor(parameters: {
        comment: Comment;
    }) {
        this.comment = parameters.comment;
    }

    async viewable(parameters: {
        viewerId: String;
        options?: {
            enableViewerCheck?: Boolean;
        };
    }): Promise<Success<ViewableComment> | Failure<ViewableCommentFailure>> {
        if (parameters.options?.enableViewerCheck === true) {
            const isViewerExists = await UsersManager.shared.exists({
                userId: parameters.viewerId
            });

            if (!isViewerExists) {
                const result = new Failure<ViewableCommentFailure>(ViewableCommentFailure.VIEWER_DOES_NOT_EXISTS);
                return result;
            }
        }

        const authorResult = await UsersManager.shared.user({
            userId: this.comment.authorId
        });

        if (authorResult instanceof Failure) {
            switch (authorResult.reason) {
                default:
                    const result = new Failure<ViewableCommentFailure>(ViewableCommentFailure.UNKNOWN);
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
                    const result = new Failure<ViewableCommentFailure>(ViewableCommentFailure.UNKNOWN);
                    return result;
            }
        }

        const viewableAuthor = viewAuthorResult.data;

        const viewableComment: ViewableComment = {
            ...this.comment,
            author: viewableAuthor
        };

        const result = new Success<ViewableComment>(viewableComment);
        return result;
    }
}


class ViewableCommentsX {
    private comments: Comment[];

    constructor(parameters: {
        comments: Comment[];
    }) {
        this.comments = parameters.comments;
    }

    async viewable(parameters: {
        viewerId: String;
        options?: {
            enableViewerCheck?: Boolean;
        };
    }): Promise<Success<ViewableComment[]> | Failure<ViewableCommentFailure>> {
        if (parameters.options?.enableViewerCheck === true) {
            const isViewerExists = await UsersManager.shared.exists({
                userId: parameters.viewerId
            });

            if (!isViewerExists) {
                const result = new Failure<ViewableCommentFailure>(ViewableCommentFailure.VIEWER_DOES_NOT_EXISTS);
                return result;
            }
        }

        const viewableComments: ViewableComment[] = [];

        for (const comment of this.comments) {
            const viewableCommentX = new ViewableCommentX({
                comment: comment
            });

            const viewableCommentResult = await viewableCommentX.viewable({
                viewerId: parameters.viewerId,
            });

            if (viewableCommentResult instanceof Failure) {
                return viewableCommentResult;
            }

            const viewableComment = viewableCommentResult.data;
            viewableComments.push(viewableComment);
        }

        const result = new Success<ViewableComment[]>(viewableComments);
        return result;
    }
}