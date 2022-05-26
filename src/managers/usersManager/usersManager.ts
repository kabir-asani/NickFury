import { User, UserViewables, ViewableUser } from "../core/models";
import { DatabaseAssistant, DatabaseCollections } from "../../assistants/database/database";
import { SocialsManager } from "../socialsManager/socialsManager";
import { ViewablesParameters2 } from "../core/types";

export class UsersManager {
    static readonly shared = new UsersManager();

    private constructor() { }

    async exists(parameters: {
        id: String;
    }): Promise<Boolean> {
        const usersCollection = DatabaseAssistant.shared.collection(DatabaseCollections.users);
        const userDocumentRef = usersCollection.doc(parameters.id.valueOf());

        const userDocument = await userDocumentRef.get();

        return userDocument.exists;
    }

    async existsByUsername(parameters: {
        username: String;
    }): Promise<Boolean> {
        const usersCollection = DatabaseAssistant.shared.collection(DatabaseCollections.users);

        const usersQuery = usersCollection
            .where(
                "username",
                "==",
                parameters.username.valueOf()
            )
            .limit(1);


        const usersQuerySnapshot = await usersQuery.get();

        return !usersQuerySnapshot.empty;
    }

    async existsByEmail(parameters: {
        email: String;
    }): Promise<Boolean> {
        const usersCollection = DatabaseAssistant.shared.collection(DatabaseCollections.users);

        const usersQuery = usersCollection
            .where(
                "email",
                "==",
                parameters.email.valueOf()
            )
            .limit(1);

        const usersQuerySnapshot = await usersQuery.get();

        return !usersQuerySnapshot.empty;
    }

    async user(parameters: {
        id: String;
    }): Promise<User | null> {
        const usersCollection = DatabaseAssistant.shared.collection(DatabaseCollections.users);
        const userDocumentRef = usersCollection.doc(parameters.id.valueOf());

        const userDocument = await userDocumentRef.get();

        if (userDocument.exists) {
            const user = userDocument.data() as unknown as User;

            return user;
        } else {
            return null;
        }
    }

    async userByEmail(parameters: {
        email: String;
    }): Promise<User | null> {
        const usersCollection = DatabaseAssistant.shared.collection(DatabaseCollections.users);

        const usersQuery = usersCollection
            .where(
                "email",
                "==",
                parameters.email.valueOf()
            )
            .limit(1);

        const usersQuerySnapshot = await usersQuery.get();

        if (usersQuerySnapshot.empty) {
            return null;
        } else {
            const user = usersQuerySnapshot.docs[0].data() as unknown as User;

            return user;
        }
    }

    async userByUsername(parameters: {
        username: String;
    }): Promise<User | null> {
        const usersCollection = DatabaseAssistant.shared.collection(DatabaseCollections.users);

        const usersQuery = usersCollection
            .where(
                "username",
                "==",
                parameters.username.valueOf()
            )
            .limit(1);

        const usersQuerySnapshot = await usersQuery.get();

        if (usersQuerySnapshot.empty) {
            return null;
        } else {
            const user = usersQuerySnapshot.docs[0].data() as unknown as User;

            return user;
        }
    }

    async viewableUser(parameters: {
        id: String;
    } & ViewablesParameters2): Promise<ViewableUser | null> {
        const user = await this.user({
            id: parameters.id
        });

        if (user !== null) {
            const userViewables = await this.userViewables({
                userId: parameters.id,
                viewerId: parameters.viewerId
            });

            if (userViewables !== null) {
                const viewableUser: ViewableUser = {
                    ...user,
                    viewables: userViewables
                };

                return viewableUser;
            } else {
                return null;
            }
        } else {
            return null;
        }
    }

    private async userViewables(parameters: {
        userId: String;
    } & ViewablesParameters2): Promise<UserViewables | null> {
        const isFollowing = await SocialsManager.shared.isFollowing({
            followerId: parameters.viewerId,
            followingId: parameters.userId
        });

        const viewables: UserViewables = {
            following: isFollowing
        };

        return viewables;
    }

    async viewableUsersByIds(parameters: {
        ids: String[]
    } & ViewablesParameters2): Promise<{ [key: string]: ViewableUser } | null> {
        const userDocumentRefs = parameters.ids.map((id) => {
            const usersCollection = DatabaseAssistant.shared.collection(DatabaseCollections.users);
            const userDocumentRef = usersCollection.doc(id.valueOf());

            return userDocumentRef;
        });

        const userDocuments = await DatabaseAssistant.shared.getAll(...userDocumentRefs);

        const users: { [key: string]: User } = {};

        for (let userDocument of userDocuments) {
            if (userDocument.exists) {
                const user = userDocument.data() as unknown as User;

                users[user.id.valueOf()] = user;
            } else {
                return null;
            }
        }

        const followingStatuses = await SocialsManager.shared.followingStatuses({
            followerId: parameters.viewerId,
            followingIds: Object.keys(users)
        });

        const viewableUsers: { [key: string]: ViewableUser } = {};

        Object.keys(users).forEach((userId) => {
            const user = users[userId];

            const userViewables: UserViewables = {
                following: followingStatuses[userId]
            };

            const viewableUser: ViewableUser = {
                ...user,
                viewables: userViewables
            };

            viewableUsers[viewableUser.id.valueOf()] = viewableUser;
        });

        return viewableUsers;
    }
}