import { Failure, Success } from "../../utils/typescriptx/typescriptx";
import { User, UserViewables } from "../core/models";
import { UserCreationFailureReason, UserUpdationFailureReason, UserViewablesFailureReason } from "./types";
import * as uuid from "uuid";
import { Dately } from "../../utils/dately/dately";
import { DatabaseAssistant, DatabaseCollections } from "../../assistants/database/database";
import { assert } from "console";
import { ViewablesParameters } from "../core/types";

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
        // TODO: Implement `UsersManager: viewables`

        const reply = new Failure<UserViewablesFailureReason>(
            UserViewablesFailureReason.unknown
        );
        return reply;
    }

    async createUser(parameters: {
        email: String;
        name: String;
        image: String;
    }): Promise<Success<User> | Failure<UserCreationFailureReason>> {
        const isUserExists = await this.exists({
            email: parameters.email
        });

        if (isUserExists) {
            const reply = new Failure<UserCreationFailureReason>(
                UserCreationFailureReason.userWithThatEmailAlreadyExists
            );
            return reply;
        }

        const userId = uuid.v4();
        const username = parameters.email.split("@")[0] + userId.substring(0, 5);

        const user: User = {
            id: userId,
            name: parameters.name,
            email: parameters.email,
            description: "",
            image: parameters.image,
            username: username,
            activityDetails: {
                tweetsCount: 0
            },
            socialDetails: {
                followersCount: 0,
                followingsCount: 0
            },
            creationDate: Dately.shared.now(),
            lastUpdatedDate: Dately.shared.now()
        }

        const usersCollection = DatabaseAssistant.shared.collection(DatabaseCollections.users);
        const userDocumentRef = usersCollection.doc(userId);

        try {
            await userDocumentRef.create(user);

            const reply = new Success<User>(user);
            return reply;
        } catch {
            const reply = new Failure<UserCreationFailureReason>(
                UserCreationFailureReason.unknown
            );
            return reply;
        }
    }

    async update(parameters: {
        username?: String;
        name?: String;
        image?: String;
        description?: String;
    }): Promise<Success<User> | Failure<UserUpdationFailureReason>> {
        // TODO: Implement `UsersManager.update`

        const reply = new Failure<UserUpdationFailureReason>(
            UserUpdationFailureReason.unknown
        );

        return reply;
    }
}