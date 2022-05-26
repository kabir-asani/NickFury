import { User, UserViewables, ViewableUser } from "../core/models";
import {
    DatabaseAssistant,
    DBCollections,
} from "../../assistants/database/database";
import { SocialsManager } from "../socialsManager/socialsManager";
import { Value, ViewablesParameters2 } from "../core/types";
import { Failure, keysOf, Success } from "../../utils/typescriptx/typescriptx";
import { ViewableUsersFailureReason } from "./types";

export class UsersManager {
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
        } & ViewablesParameters2
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
        } & ViewablesParameters2
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

    async viewableUsers(
        parameters: {
            identifiers: String[];
        } & ViewablesParameters2
    ): Promise<
        Success<Value<ViewableUser>> | Failure<ViewableUsersFailureReason>
    > {
        const userDocumentRefs = parameters.identifiers.map((id) => {
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
                const reply = new Failure<ViewableUsersFailureReason>(
                    ViewableUsersFailureReason.missingUsers
                );

                return reply;
            }

            const user = userDocument.data() as unknown as User;

            users[user.id.valueOf()] = user;
        }

        const userIds = keysOf(users);

        const followingStatuses =
            await SocialsManager.shared.followerRelationshipStatuses({
                followerId: parameters.viewerId,
                followingIdentifiers: userIds,
            });

        const viewableUsers: Value<ViewableUser> = {};

        userIds.forEach((userId) => {
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
