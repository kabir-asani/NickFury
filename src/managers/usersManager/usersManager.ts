import { Failure, Success } from "../../utils/typescriptx/typescriptx";
import { User, UserViewables } from "../core/models";
import { UserViewablesFailureReason } from "./types";
import * as uuid from "uuid";
import { Dately } from "../../utils/dately/dately";
import { DatabaseAssistant, DatabaseCollections } from "../../assistants/database/database";
import { assert } from "console";
import { ViewablesParameters } from "../core/types";
import { SocialsManager } from "../socialsManager/socialsManager";

export class UsersManager {
    static readonly shared = new UsersManager();

    private constructor() { }

    async exists(parameters: {
        id?: String;
        email?: String;
        username?: String;
    }): Promise<Boolean> {
        assert(
            parameters.id !== undefined || parameters.email !== undefined || parameters.username !== undefined,
            "At least one of id, email or username should be present"
        );

        const usersCollection = DatabaseAssistant.shared.collection(DatabaseCollections.users);

        let usersQuery = usersCollection.limit(1);

        if (parameters.id !== undefined) {
            usersQuery = usersQuery.where(
                "id",
                "==",
                parameters.id
            );
        }

        if (parameters.email !== undefined) {
            usersQuery = usersQuery.where(
                "email",
                "==",
                parameters.email
            );
        }

        if (parameters.username !== undefined) {
            usersQuery = usersQuery.where(
                "username",
                "==",
                parameters.username
            );
        }

        try {
            const querySnapshot = await usersQuery.get();

            if (querySnapshot.empty) {
                return false;
            }

            return true;
        } catch {
            return false;
        }
    }


    async user(parameters: {
        id?: String;
        email?: String;
        username?: String;
    }): Promise<User | null> {
        assert(
            parameters.id !== undefined || parameters.email !== undefined || parameters.username !== undefined,
            "At least one of id, email or username should be present"
        );

        const usersCollection = DatabaseAssistant.shared.collection(DatabaseCollections.users);

        let usersQuery = usersCollection.limit(1);

        if (parameters.id !== undefined) {
            usersQuery = usersQuery.where(
                "id",
                "==",
                parameters.id
            );
        }

        if (parameters.email !== undefined) {
            usersQuery = usersQuery.where(
                "email",
                "==",
                parameters.email
            );
        }

        if (parameters.username !== undefined) {
            usersQuery = usersQuery.where(
                "username",
                "==",
                parameters.username
            );
        }

        try {
            const querySnapshot = await usersQuery.get();

            if (querySnapshot.empty) {
                return null;
            }

            const user = querySnapshot.docs[0].data() as unknown as User;
            return user;
        } catch {
            return null;
        }
    }

    async viewables(
        parameters: {
            userId: String;
        } & ViewablesParameters
    ): Promise<Success<UserViewables> | Failure<UserViewablesFailureReason>> {
        const isFollowing = await SocialsManager.shared.isFollowing({
            followerId: parameters.viewerId,
            followingId: parameters.userId
        });

        const viewables: UserViewables = {
            following: isFollowing
        };

        const reply = new Success<UserViewables>(viewables);

        return reply;
    }
}