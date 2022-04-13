import { assert } from 'console';
import * as uuid from 'uuid';
import { DatabaseAssistant } from "../../assistants/database/database";
import { Dately } from '../../utils/dately/dately';
import { Failure, Success } from '../../utils/typescriptx/typescriptx';
import { TxCollections } from '../core/collections';
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
            const collectionRef = DatabaseAssistant.shared.collection(TxCollections.users);
            const documentRef = collectionRef.doc(parameters.userId.valueOf());
            const document = await documentRef.get();

            if (document.exists) {
                return true;
            } else {
                return false;
            }
        }

        if (parameters.username !== undefined) {
            const collectionRef = DatabaseAssistant.shared.collection(TxCollections.users);
            const query = collectionRef.where(
                "username",
                "==",
                parameters.username.valueOf(),
            );

            const querySnapshot = await query.get();

            if (querySnapshot.empty) {
                return false;
            } else {
                return true;
            }
        }

        if (parameters.email !== undefined) {
            const collectionRef = DatabaseAssistant.shared.collection(TxCollections.users);
            const query = collectionRef.where(
                "email",
                "==",
                parameters.email.valueOf(),
            );

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

        const collectionRef = DatabaseAssistant.shared.collection(TxCollections.users);
        const documentRef = collectionRef.doc(user.id.valueOf());

        try {
            await documentRef.create(user);

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
            const collectionRef = DatabaseAssistant.shared.collection(TxCollections.users);
            const documentRef = collectionRef.doc(parameters.userId.valueOf());
            const document = await documentRef.get();

            if (document.exists) {
                const user = document.data() as unknown as User;

                const result = new Success<User>(user);
                return result;
            } else {
                const result = new Failure<UserFailure>(UserFailure.USER_DOES_NOT_EXISTS);
                return result;
            }
        }

        if (parameters.username !== undefined) {
            const collectionRef = DatabaseAssistant.shared.collection(TxCollections.users);
            const query = collectionRef.where(
                "username",
                "==",
                parameters.username.valueOf(),
            );

            const querySnapshot = await query.get();

            if (querySnapshot.empty) {
                const result = new Failure<UserFailure>(UserFailure.USER_DOES_NOT_EXISTS);
                return result;
            } else {
                const user = querySnapshot.docs[0].data() as unknown as User;

                const result = new Success<User>(user);
                return result;
            }
        }

        if (parameters.email !== undefined) {
            const collectionRef = DatabaseAssistant.shared.collection(TxCollections.users);
            const query = collectionRef.where(
                "email",
                "==",
                parameters.email.valueOf(),
            );

            const querySnapshot = await query.get();

            if (querySnapshot.empty) {
                const result = new Failure<UserFailure>(UserFailure.USER_DOES_NOT_EXISTS);
                return result;
            } else {
                const user = querySnapshot.docs[0].data() as unknown as User;

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
        const collectionRef = DatabaseAssistant.shared.collection(TxCollections.users);
        const documentRef = collectionRef.doc(parameters.userId.valueOf());
        const document = await documentRef.get();

        if (document.exists) {
            const currentUser = document.data() as unknown as User;
            const updatedUser = parameters.update(currentUser);

            try {
                await documentRef.update(updatedUser);

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
        const collectionRef = DatabaseAssistant.shared.collection(TxCollections.users);

        const isKeywordEmpty = parameters.keyword.length === 0;
        if (isKeywordEmpty) {
            const result = new Failure<SearchUsersFailure>(SearchUsersFailure.MALFORMED_KEYWORD);
            return result;
        } else {
            const isLeadingCharacterUnderscoreInKeyword = parameters.keyword[0] === "_";
            const isLeadingCharacterNumericInKeyword = parameters.keyword[0].match(/^[0-9]$/i) === null;
            const areChractersOutsideAllowedSet = parameters.keyword.match(/^[A-Za-z0-9_]+$/i) === null;

            if (
                isLeadingCharacterNumericInKeyword
                ||
                isLeadingCharacterUnderscoreInKeyword
                ||
                areChractersOutsideAllowedSet
            ) {
                const result = new Failure<SearchUsersFailure>(SearchUsersFailure.MALFORMED_KEYWORD);
                return result;
            }
        }

        const limit = parameters.limit?.valueOf() || 10;
        const nextToken = parameters.nextToken?.valueOf() || ":";

        const usernextToken = nextToken.split(":")[0];
        const nameNextToken = nextToken.split(":")[1];

        let usernamesQuery = collectionRef
            .orderBy("username")
            .where(
                "username",
                ">=",
                parameters.keyword.valueOf(),
            )
            .where(
                "username",
                "<=",
                parameters.keyword[0].valueOf(),
            ).limit(limit + 1);

        if (usernextToken !== "") {
            const documentRef = collectionRef.doc(usernextToken);

            usernamesQuery = usernamesQuery.startAfter(documentRef);
        }

        let namesQuery = collectionRef
            .orderBy("name")
            .where(
                "name",
                ">=",
                parameters.keyword.valueOf(),
            )
            .where(
                "username",
                "<",
                parameters.keyword[0].valueOf(),
            ).limit(limit + 1);

        if (nameNextToken !== "") {
            const documentRef = collectionRef.doc(nameNextToken);

            namesQuery = namesQuery.startAfter(documentRef);
        }

        try {
            const useranmeQuerySnapshot = await usernamesQuery.get();
            const nameQuerySnapshot = await namesQuery.get();

            const usernameQueryDocs = useranmeQuerySnapshot.docs;
            const nameQueryDocs = nameQuerySnapshot.docs;

            const usernameDocs: User[] = [];
            for (const usernameQueryDoc of usernameQueryDocs) {
                const user = usernameQueryDoc.data() as User;

                usernameDocs.push(user);
            }

            const nameDocs: User[] = [];
            for (const nameQueryDoc of nameQueryDocs) {
                const user = nameQueryDoc.data() as User;

                nameDocs.push(user);
            }


            const usernamesNextToken = usernameDocs.length === limit
                ? usernameDocs[usernameDocs.length - 1].id
                : undefined;

            const namesNextToken = nameDocs.length === limit
                ? nameDocs[nameDocs.length - 1].id
                : undefined;

            const nextToken = usernamesNextToken !== undefined || namesNextToken !== undefined
                ? `${usernamesNextToken || ""}:${namesNextToken || ""}`
                : undefined;

            const users: User[] = [
                ...(usernameDocs.length === limit
                    ? usernameDocs.slice(0, usernameDocs.length - 1)
                    : usernameDocs),
                ...(nameDocs.length === limit
                    ? nameDocs.slice(0, nameDocs.length - 1)
                    : nameDocs),
            ];

            const paginatedUsers = new Paginated<User>({
                page: users,
                nextToken: nextToken
            });

            const result = new Success<Paginated<User>>(paginatedUsers);
            return result;
        } catch {
            const result = new Failure<SearchUsersFailure>(SearchUsersFailure.UNKNOWN);
            return result;
        }
    }
}
