import { assert } from 'console';
import * as uuid from 'uuid';

import { DatabaseAssistant } from "../../assistants/database/database";
import { Dately } from '../../utils/dately/dately';
import { Empty, Failure, Success } from '../../utils/typescriptx/typescriptx';
import { TxCollections } from '../core/collections';
import { ViewableUser, User, UserViewerMeta } from './models';
import { SocialsManager } from './socialsManager/socialsManager';
import { CreateUserFailure, UpdateUserFailure, ViewableUserFailre, UserFailure } from './types';

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
                followingCount: 0,
            },
            tweetsDetails: {
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
}
