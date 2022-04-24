import { assert } from 'console';
import * as uuid from 'uuid';
import { DatabaseAssistant } from "../../assistants/database/database";
import { Dately } from '../../utils/dately/dately';
import { Failure, Success } from '../../utils/typescriptx/typescriptx';
import { TxDatabaseCollections } from '../core/collections';
import { Paginated, PaginationQuery } from '../core/types';
import { User } from './models';
import {
    CreateUserFailure,
    UpdateUserFailure,
    UserFailure,
    SearchUsersFailure
} from './types';

export class UsersManager {
    public static readonly shared = new UsersManager();

    private constructor() { }

    async exists(parameters: {
        userId?: String,
        username?: String,
        email?: String,
    }): Promise<Boolean> {
        assert(
            parameters.userId !== undefined || parameters.username !== undefined || parameters.email !== undefined,
            "One of id, username or email has to be present"
        );

        if (parameters.userId !== undefined) {
            const collectionRef = DatabaseAssistant.shared.collection(TxDatabaseCollections.users);
            const documentRef = collectionRef.doc(parameters.userId.valueOf());
            const document = await documentRef.get();

            if (document.exists) {
                return true;
            } else {
                return false;
            }
        }

        if (parameters.username !== undefined) {
            const collectionRef = DatabaseAssistant.shared.collection(TxDatabaseCollections.users);
            const query = collectionRef.where(
                "username",
                "==",
                parameters.username.valueOf(),
            ).limit(1);

            const querySnapshot = await query.get();

            if (querySnapshot.empty) {
                return false;
            } else {
                return true;
            }
        }

        if (parameters.email !== undefined) {
            const collectionRef = DatabaseAssistant.shared.collection(TxDatabaseCollections.users);
            const query = collectionRef.where(
                "email",
                "==",
                parameters.email.valueOf(),
            ).limit(1);

            const querySnapshot = await query.get();

            if (querySnapshot.empty) {
                return false;
            } else {
                return true;
            }
        }


        return false;
    }

    async createUser(parameters: {
        name: String;
        email: String;
        image: String;
    }): Promise<Success<User> | Failure<CreateUserFailure>> {
        const isUserExists = await this.exists({
            email: parameters.email
        });

        if (isUserExists) {
            const result = new Failure<CreateUserFailure>(
                CreateUserFailure.USER_ALREADY_EXISTS
            );
            return result;
        }

        const user: User = {
            id: uuid.v4(),
            name: parameters.name,
            email: parameters.email,
            username: parameters.email.split('@')[0] + uuid.v4().substring(0, 5),
            image: parameters.image,
            creationDate: Dately.shared.now(),
            socialDetails: {
                followersCount: 0,
                followingsCount: 0,
            },
            activityDetails: {
                tweetsCount: 0,
            },
        };

        const usersCollectionRef = DatabaseAssistant.shared.collection(TxDatabaseCollections.users);
        const userDocumentRef = usersCollectionRef.doc(user.id.valueOf());

        try {
            await userDocumentRef.create(user);

            const result = new Success<User>(
                user
            );
            return result;
        } catch {
            const result = new Failure<CreateUserFailure>(
                CreateUserFailure.UNKNOWN
            );
            return result;
        }
    }

    async user(parameters: {
        userId?: String;
        username?: String;
        email?: String;
    }): Promise<Success<User> | Failure<UserFailure>> {
        assert(
            parameters.userId !== undefined || parameters.username !== undefined || parameters.email !== undefined,
            "One of id, username or email has to be present"
        );


        if (parameters.userId !== undefined) {
            const usersCollectionRef = DatabaseAssistant.shared.collection(TxDatabaseCollections.users);
            const userDocumentRef = usersCollectionRef.doc(parameters.userId.valueOf());
            const userDocument = await userDocumentRef.get();

            if (userDocument.exists) {
                const user = userDocument.data() as unknown as User;

                const result = new Success<User>(user);
                return result;
            } else {
                const result = new Failure<UserFailure>(UserFailure.USER_DOES_NOT_EXISTS);
                return result;
            }
        }

        if (parameters.username !== undefined) {
            const usersCollectionRef = DatabaseAssistant.shared.collection(TxDatabaseCollections.users);
            const usersQuery = usersCollectionRef.where(
                "username",
                "==",
                parameters.username.valueOf(),
            ).limit(1);

            const usersQuerySnapshot = await usersQuery.get();

            if (usersQuerySnapshot.empty) {
                const result = new Failure<UserFailure>(UserFailure.USER_DOES_NOT_EXISTS);
                return result;
            } else {
                const user = usersQuerySnapshot.docs[0].data() as unknown as User;

                const result = new Success<User>(user);
                return result;
            }
        }

        if (parameters.email !== undefined) {
            const usersCollectionRef = DatabaseAssistant.shared.collection(TxDatabaseCollections.users);
            const usersQuery = usersCollectionRef.where(
                "email",
                "==",
                parameters.email.valueOf(),
            ).limit(1);

            const usersQuerySnapshot = await usersQuery.get();

            if (usersQuerySnapshot.empty) {
                const result = new Failure<UserFailure>(UserFailure.USER_DOES_NOT_EXISTS);
                return result;
            } else {
                const user = usersQuerySnapshot.docs[0].data() as unknown as User;

                const result = new Success<User>(user);
                return result;
            }
        }

        const result = new Failure<UserFailure>(UserFailure.UNKNOWN);
        return result;
    }

    async updateUser(parameters: {
        userId: String;
        update: (currentUser: User) => User;
    }): Promise<Success<User> | Failure<UpdateUserFailure>> {
        const usersCollectionRef = DatabaseAssistant.shared.collection(TxDatabaseCollections.users);
        const userDocumentRef = usersCollectionRef.doc(parameters.userId.valueOf());
        const userDocument = await userDocumentRef.get();

        if (userDocument.exists) {
            const currentUser = userDocument.data() as unknown as User;
            const updatedUser = parameters.update(currentUser);

            try {
                await userDocumentRef.update(updatedUser);

                const result = new Success<User>(updatedUser);
                return result;
            } catch {
                const result = new Failure<UpdateUserFailure>(UpdateUserFailure.USER_DOES_NOT_EXISTS);
                return result;
            }
        }

        const result = new Failure<UpdateUserFailure>(UpdateUserFailure.UNKNOWN);
        return result;
    }

    async search(parameters: {
        keyword: String;
    } & PaginationQuery): Promise<Success<Paginated<User>> | Failure<SearchUsersFailure>> {
        const usersCollectionRef = DatabaseAssistant.shared.collection(TxDatabaseCollections.users);

        const isKeywordEmpty = parameters.keyword.length === 0;

        if (isKeywordEmpty) {
            const result = new Failure<SearchUsersFailure>(SearchUsersFailure.MALFORMED_KEYWORD);
            return result;
        }

        const limit = parameters.limit?.valueOf() || 10;
        const nextToken = parameters.nextToken?.valueOf();

        let usernamesQuery = usersCollectionRef
            .orderBy("username")
            .where(
                "username",
                ">=",
                parameters.keyword.valueOf(),
            )
            .where(
                "username",
                "<",
                parameters.keyword[0].valueOf() + 1,
            ).limit(limit + 1);

        if (nextToken !== undefined && nextToken !== null) {
            const documentRef = usersCollectionRef.doc(nextToken);

            usernamesQuery = usernamesQuery.startAfter(documentRef);
        }

        try {
            const useranmeQuerySnapshot = await usernamesQuery.get();

            const usernameQueryDocs = useranmeQuerySnapshot.docs;

            const usernameDocs: User[] = [];
            for (const usernameQueryDoc of usernameQueryDocs) {
                const user = usernameQueryDoc.data() as User;

                usernameDocs.push(user);
            }

            const usernamesNextToken = usernameDocs.length === limit
                ? usernameDocs[usernameDocs.length - 1].id
                : undefined;

            const users: User[] = usernameDocs.length === limit
                ? usernameDocs.slice(0, usernameDocs.length - 1)
                : usernameDocs;

            const paginatedUsers = new Paginated<User>({
                page: users,
                nextToken: usernamesNextToken
            });

            const result = new Success<Paginated<User>>(paginatedUsers);
            return result;
        } catch {
            const result = new Failure<SearchUsersFailure>(SearchUsersFailure.UNKNOWN);
            return result;
        }
    }
}
