import { User, UserViewables, ViewableUser } from "../core/models";
import {
    DatabaseAssistant,
    DBCollections,
} from "../../assistants/database/database";
import SocialsManager from "../socialsManager/socialsManager";
import { Value, ViewablesParameters } from "../core/types";
import { Failure, keysOf, Success } from "../../utils/typescriptx/typescriptx";
import { UsersFailureReason, ViewableUsersFailureReason } from "./types";

export default class UsersManager {
    static readonly shared = new UsersManager();

    private constructor() {}

    async exists(parameters: { id: String }): Promise<Boolean> {
        const usersCollection = DatabaseAssistant.shared.collection(
            DBCollections.users
        );
        const userDocumentRef = usersCollection.doc(parameters.id.valueOf());

        const userDocument = await userDocumentRef.get();

        if (userDocument.exists) {
            return true;
        }

        return false;
    }

    async existsWithUsername(parameters: {
        username: String;
    }): Promise<Boolean> {
        const usersCollection = DatabaseAssistant.shared.collection(
            DBCollections.users
        );

        const usersQuery = usersCollection
            .where("username", "==", parameters.username.valueOf())
            .limit(1);

        const usersQuerySnapshot = await usersQuery.get();

        if (!usersQuerySnapshot.empty) {
            return true;
        }

        return false;
    }

    async existsWithEmail(parameters: { email: String }): Promise<Boolean> {
        const usersCollection = DatabaseAssistant.shared.collection(
            DBCollections.users
        );

        const usersQuery = usersCollection
            .where("email", "==", parameters.email.valueOf())
            .limit(1);

        const usersQuerySnapshot = await usersQuery.get();

        if (!usersQuerySnapshot.empty) {
            return true;
        }

        return false;
    }

    async user(parameters: { id: String }): Promise<User | null> {
        const usersCollection = DatabaseAssistant.shared.collection(
            DBCollections.users
        );
        const userDocumentRef = usersCollection.doc(parameters.id.valueOf());

        const userDocument = await userDocumentRef.get();

        if (userDocument.exists) {
            const user = userDocument.data() as unknown as User;

            return user;
        }

        return null;
    }

    async userWithEmail(parameters: { email: String }): Promise<User | null> {
        const usersCollection = DatabaseAssistant.shared.collection(
            DBCollections.users
        );

        const usersQuery = usersCollection
            .where("email", "==", parameters.email.valueOf())
            .limit(1);

        const usersQuerySnapshot = await usersQuery.get();

        if (!usersQuerySnapshot.empty) {
            const user = usersQuerySnapshot.docs[0].data() as unknown as User;

            return user;
        }

        return null;
    }

    async userWithUsername(parameters: {
        username: String;
    }): Promise<User | null> {
        const usersCollection = DatabaseAssistant.shared.collection(
            DBCollections.users
        );

        const usersQuery = usersCollection
            .where("username", "==", parameters.username.valueOf())
            .limit(1);

        const usersQuerySnapshot = await usersQuery.get();

        if (!usersQuerySnapshot.empty) {
            const user = usersQuerySnapshot.docs[0].data() as unknown as User;

            return user;
        }

        return null;
    }

    async viewableUser(
        parameters: {
            id: String;
        } & ViewablesParameters
    ): Promise<ViewableUser | null> {
        const user = await this.user({
            id: parameters.id,
        });

        if (user !== null) {
            const userViewables = await this.userViewables({
                userId: parameters.id,
                viewerId: parameters.viewerId,
            });

            if (userViewables !== null) {
                const viewableUser: ViewableUser = {
                    ...user,
                    viewables: userViewables,
                };

                return viewableUser;
            }
        }

        return null;
    }

    private async userViewables(
        parameters: {
            userId: String;
        } & ViewablesParameters
    ): Promise<UserViewables | null> {
        const isFollowing =
            await SocialsManager.shared.isFollowingRelationshipExists({
                followerId: parameters.viewerId,
                followingId: parameters.userId,
            });

        const viewables: UserViewables = {
            following: isFollowing,
        };

        return viewables;
    }

    async users(parameters: {
        userIdentifiers: String[];
    }): Promise<Success<Value<User>> | Failure<UsersFailureReason>> {
        if (parameters.userIdentifiers.length === 0) {
            const reply = new Success<Value<User>>({});

            return reply;
        }

        const userDocumentRefs = parameters.userIdentifiers.map((id) => {
            const usersCollection = DatabaseAssistant.shared.collection(
                DBCollections.users
            );
            const userDocumentRef = usersCollection.doc(id.valueOf());

            return userDocumentRef;
        });

        const userDocuments = await DatabaseAssistant.shared.getAll(
            ...userDocumentRefs
        );

        const users: Value<User> = {};

        for (let userDocument of userDocuments) {
            if (!userDocument.exists) {
                const reply = new Failure<UsersFailureReason>(
                    UsersFailureReason.missingUsers
                );

                return reply;
            }

            const user = userDocument.data() as unknown as User;

            users[user.id.valueOf()] = user;
        }

        const reply = new Success<Value<User>>(users);

        return reply;
    }

    async viewableUsers(
        parameters: {
            userIdentifiers: String[];
        } & ViewablesParameters
    ): Promise<
        Success<Value<ViewableUser>> | Failure<ViewableUsersFailureReason>
    > {
        if (parameters.userIdentifiers.length === 0) {
            const reply = new Success<Value<ViewableUser>>({});

            return reply;
        }

        const usersResult = await this.users({
            userIdentifiers: parameters.userIdentifiers,
        });

        if (usersResult instanceof Failure) {
            switch (usersResult.reason) {
                case UsersFailureReason.missingUsers: {
                    const reply = new Failure<ViewableUsersFailureReason>(
                        ViewableUsersFailureReason.missingUsers
                    );

                    return reply;
                }
                default: {
                    const reply = new Failure<ViewableUsersFailureReason>(
                        ViewableUsersFailureReason.unknown
                    );

                    return reply;
                }
            }
        }

        const users = usersResult.data;

        const followingStatuses =
            await SocialsManager.shared.followerRelationshipStatuses({
                followerId: parameters.viewerId,
                followingIdentifiers: keysOf(users),
            });

        const viewableUsers: Value<ViewableUser> = {};

        keysOf(users).forEach((userId) => {
            const user = users[userId];

            const userViewables: UserViewables = {
                following: followingStatuses[userId],
            };

            const viewableUser: ViewableUser = {
                ...user,
                viewables: userViewables,
            };

            viewableUsers[viewableUser.id.valueOf()] = viewableUser;
        });

        const reply = new Success<Value<ViewableUser>>(viewableUsers);

        return reply;
    }
}
