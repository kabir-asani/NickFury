import * as uuid from "uuid";

import { DatabaseAssistant, DatabaseCollections } from "../../assistants/database/database";
import { Dately } from "../../utils/dately/dately";
import { Success, Failure } from "../../utils/typescriptx/typescriptx";
import { User } from "../core/models";
import { UsersManager } from "../usersManager/usersManager";
import { SelfCreationFailureReason, SelfUpdationFailureReason } from "./types";


export class SelfManager {
    static readonly shared = new SelfManager();

    async create(parameters: {
        email: String;
        name: String;
        image: String;
    }): Promise<Success<User> | Failure<SelfCreationFailureReason>> {
        const isOtherUserExists = await UsersManager.shared.exists({
            email: parameters.email
        });

        if (isOtherUserExists) {
            const reply = new Failure<SelfCreationFailureReason>(
                SelfCreationFailureReason.otherUserWithThatEmailAlreadyExists
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
            const reply = new Failure<SelfCreationFailureReason>(
                SelfCreationFailureReason.unknown
            );
            return reply;
        }
    }

    async self(parameters: {
        id: String
    }): Promise<User | null> {
        const usersCollection = DatabaseAssistant.shared.collection(DatabaseCollections.users);
        const userDocumentRef = usersCollection.doc(parameters.id.valueOf());

        try {
            const userDocument = await userDocumentRef.get();

            if (userDocument.exists) {
                const user = userDocument.data() as unknown as User;

                return user;
            } else {
                return null;
            }
        } catch {
            return null;
        }
    }

    async update(parameters: {
        id: String;
        updates: {
            username?: String;
            name?: String;
            image?: String;
            description?: String;
        }
    }): Promise<Success<User> | Failure<SelfUpdationFailureReason>> {
        if (parameters.updates.username !== undefined) {
            // TODO: Check if username is valid
        }

        if (parameters.updates.username !== undefined) {
            const user = await UsersManager.shared.user({
                username: parameters.updates.username
            });

            if (user !== null && user.id !== parameters.id) {
                const reply = new Failure<SelfUpdationFailureReason>(
                    SelfUpdationFailureReason.otherUserWithThatUsernameAlreadyExists
                );

                return reply;
            }
        }

        if (parameters.updates.name !== undefined) {
            // TODO: Check if name is valid
        }

        if (parameters.updates.image !== undefined) {
            // TODO: Check if image-url is valid
        }

        if (parameters.updates.description !== undefined) {
            // TODO: Check if description is valid
        }

        try {
            const updatedUser = await DatabaseAssistant.shared.runTransaction(async (transaction) => {
                const usersCollection = DatabaseAssistant.shared.collection(DatabaseCollections.users);
                const userDocumentRef = usersCollection.doc(parameters.id.valueOf());

                const userDocument = await transaction.get(userDocumentRef);

                const user = userDocument.data() as unknown as User;

                const updatedUser: User = {
                    ...user,
                    username: parameters.updates.username || user.username,
                    image: parameters.updates.image || user.image,
                    name: parameters.updates.name || user.name,
                    description: parameters.updates.description || user.description
                }

                transaction.update(
                    userDocumentRef,
                    updatedUser
                );

                return Promise.resolve(updatedUser);
            });

            const reply = new Success<User>(updatedUser);

            return reply;
        } catch {
            const reply = new Failure<SelfUpdationFailureReason>(
                SelfUpdationFailureReason.unknown
            );

            return reply;
        }
    }
}