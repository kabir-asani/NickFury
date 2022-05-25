import { assert } from "console";
import { DatabaseAssistant, DatabaseCollections } from "../../../assistants/database/database";
import { Empty, Failure, Success } from "../../../utils/typescriptx/typescriptx";
import { Like, ViewableLike } from "../../core/models";
import { Paginated, PaginationParameters, ViewablesParameters } from "../../core/types";
import { LikeCreationFailureReason, LikeDeletionFailureReason } from "./types";

export class LikesManager {
    static readonly shared = new LikesManager();

    private constructor() { }

    async exists(parameters: {
        likeId?: String;
        likeDetails: {
            tweetId: String;
            authorId: String;
        }
    }): Promise<Boolean> {
        assert(
            parameters.likeId !== undefined || parameters.likeDetails !== undefined,
            "At least one of likeId or likeDetails should be present"
        );

        const likesCollection = DatabaseAssistant.shared.collectionGroup(DatabaseCollections.likes);

        let likesQuery = likesCollection
            .limit(1);

        if (parameters.likeId !== undefined) {
            likesQuery = likesQuery
                .where(
                    "id",
                    "==",
                    parameters.likeId.valueOf()
                );
        } else if (parameters.likeDetails !== undefined) {
            likesQuery = likesQuery
                .where(
                    "tweetId",
                    "==",
                    parameters.likeDetails.tweetId.valueOf()
                )
                .where(
                    "authorId",
                    "==",
                    parameters.likeDetails.authorId
                );
        }


        try {
            const likesQuerySnapshot = await likesQuery.get();

            if (likesQuerySnapshot.docs.length > 0) {
                return true;
            } else {
                return false;
            }
        } catch {
            return false;
        }
    }

    async create(parameters: {
        tweetId: String;
        authorId: String;
    }): Promise<Success<Like> | Failure<LikeCreationFailureReason>> {
        // TODO: Implement `LikesManager.create`
        const reply = new Failure<LikeCreationFailureReason>(
            LikeCreationFailureReason.unknown
        );

        return reply;
    }

    async delete(parameters: {
        likeId: String;
    }): Promise<Success<Empty> | Failure<LikeDeletionFailureReason>> {
        // TODO: Implement `LikesManager.delete`
        const reply = new Failure<LikeDeletionFailureReason>(
            LikeDeletionFailureReason.unknown
        );

        return reply;
    }

    async likes(parameters: {
        tweetId: String;
    } & PaginationParameters & ViewablesParameters
    ): Promise<Paginated<Like | ViewableLike> | null> {
        // TODO: Implement `LikesManager.likes`
        return null;
    }
}