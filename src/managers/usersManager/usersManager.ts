import { User, UserViewables, ViewableUser } from "../core/models";
import DatabaseAssistant from "../../assistants/database/database";
import SocialsManager from "../socialsManager/socialsManager";
import {
    kMaximumPaginatedPageLength,
    Paginated,
    PaginationParameters,
    Value,
    ViewablesParameters,
} from "../core/types";
import { Failure, keysOf, Success } from "../../utils/typescriptx/typescriptx";
import {
    SearchFailureReason,
    UsersFailureReason,
    ViewableUsersFailureReason,
} from "./types";
import logger, { LogLevel } from "../../utils/logger/logger";
import { PaginatedFollowersFailureReason } from "../socialsManager/types";

export default class UsersManager {
    static readonly shared = new UsersManager();

    private constructor() {}

    async exists(parameters: { id: String }): Promise<Boolean> {
        const userDocumentRef = DatabaseAssistant.shared.userDocumentRef({
            userId: parameters.id,
        });

        const userDocument = await userDocumentRef.get();

        if (userDocument.exists) {
            return true;
        }

        return false;
    }

    async existsWithUsername(parameters: {
        username: String;
    }): Promise<Boolean> {
        const usersCollection = DatabaseAssistant.shared.usersCollectionRef();

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
        const usersCollection = DatabaseAssistant.shared.usersCollectionRef();

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
        const userDocumentRef = DatabaseAssistant.shared.userDocumentRef({
            userId: parameters.id,
        });

        const userDocument = await userDocumentRef.get();

        if (userDocument.exists) {
            const user = userDocument.data() as unknown as User;

            return user;
        }

        return null;
    }

    async userWithEmail(parameters: { email: String }): Promise<User | null> {
        const usersCollection = DatabaseAssistant.shared.usersCollectionRef();

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
        const usersCollection = DatabaseAssistant.shared.usersCollectionRef();

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
            await SocialsManager.shared.isFollowedRelationshipExists({
                followerId: parameters.viewerId,
                followeeId: parameters.userId,
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

        const userDocumentRefs = parameters.userIdentifiers.map((userId) => {
            const userDocumentRef = DatabaseAssistant.shared.userDocumentRef({
                userId: userId,
            });

            return userDocumentRef;
        });

        const userDocuments = await DatabaseAssistant.shared.all(
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
            await SocialsManager.shared.followingRelationshipStatuses({
                followerId: parameters.viewerId,
                followeeIdentifiers: keysOf(users),
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

    async search(
        parameters: {
            prefix: String;
        } & PaginationParameters &
            ViewablesParameters
    ): Promise<
        Success<Paginated<ViewableUser>> | Failure<SearchFailureReason>
    > {
        const usersCollection = DatabaseAssistant.shared.usersCollectionRef();

        const limit =
            parameters.limit?.valueOf() || kMaximumPaginatedPageLength;

        const lowercasePrefix = parameters.prefix.toLowerCase();

        let query = usersCollection
            .orderBy("username")
            .where("username", ">=", lowercasePrefix.valueOf())
            .where("username", "<=", lowercasePrefix + "\uf7ff")
            .limit(limit + 1);

        if (parameters.nextToken !== undefined) {
            query = query.startAt(parameters.nextToken);
        }

        try {
            const querySnapshot = await query.get();

            if (querySnapshot.empty) {
                const paginatedUsers: Paginated<ViewableUser> = {
                    page: [],
                };

                const reply = new Success<Paginated<ViewableUser>>(
                    paginatedUsers
                );

                return reply;
            }

            let nextToken = undefined;

            if (querySnapshot.docs.length === limit + 1) {
                const lastDocument = querySnapshot.docs.pop();

                if (lastDocument !== undefined) {
                    nextToken = (lastDocument.data() as unknown as User)
                        .creationDate;
                }
            }

            const users = querySnapshot.docs.map((queryDocument) => {
                const user = queryDocument.data() as unknown as User;

                return user;
            });

            const followingStatuses =
                await SocialsManager.shared.followingRelationshipStatuses({
                    followerId: parameters.viewerId,
                    followeeIdentifiers: users.map((user) => {
                        return user.id;
                    }),
                });

            const viewableUsers: ViewableUser[] = [];

            users.forEach((user) => {
                const userViewables: UserViewables = {
                    following: followingStatuses[user.id.valueOf()],
                };

                const viewableUser: ViewableUser = {
                    ...user,
                    viewables: userViewables,
                };

                viewableUsers.push(viewableUser);
            });

            const paginatedViewableUsers: Paginated<ViewableUser> = {
                page: viewableUsers,
                nextToken: nextToken,
            };

            const reply = new Success<Paginated<ViewableUser>>(
                paginatedViewableUsers
            );

            return reply;
        } catch (e) {
            logger(e, LogLevel.attention, [this, this.search]);

            const reply = new Failure<SearchFailureReason>(
                SearchFailureReason.unknown
            );

            return reply;
        }
    }
}
