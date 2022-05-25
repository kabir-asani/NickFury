import { Empty, Failure, Success } from "../../../utils/typescriptx/typescriptx";
import { ViewableComment } from "../../core/models";
import { Paginated, PaginationParameters, ViewablesParameters } from "../../core/types";
import { CommentCreationFailureReason, CommentDeletionFailureReason } from "./types";

export class CommentsManager {
    static readonly shared = new CommentsManager();

    private constructor() { }

    async exists(parameters: {
        commentId: String;
    }): Promise<Boolean> {
        // TODO: Implement `CommentsManager.exists`
        return false;
    }

    async create(parameters: {
        tweetId: String;
        authorId: String;
        comment: {
            text: String;
        }
    }): Promise<Success<Comment> | Failure<CommentCreationFailureReason>> {
        // TODO: Implement `CommentsManager.create`
        const reply = new Failure<CommentCreationFailureReason>(
            CommentCreationFailureReason.unknown
        );


        return reply;
    }

    async delete(parameters: {
        commentId: String;
    }): Promise<Success<Empty> | Failure<CommentDeletionFailureReason>> {
        // TODO: Implement `CommentsManager.delete`
        const reply = new Failure<CommentDeletionFailureReason>(
            CommentDeletionFailureReason.unknown
        );

        return reply;
    }

    async comments(parameters: {
        tweetId: String;
    } & PaginationParameters & ViewablesParameters
    ): Promise<Paginated<Comment | ViewableComment> | null> {
        // TODO: Implement `CommentsManager.comments`
        return null;
    }
}