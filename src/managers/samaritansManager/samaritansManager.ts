import { assert } from 'console';
import * as uuid from 'uuid';

import { DatabaseAssistant } from "../../assistants/database/database";
import { TxDatabaseCollections } from '../core/collections';
import { Samaritan } from './models';
import { SamaritanAlreadyExists, CreateSamaritanFailure, CreateSamaritanSuccess } from './types';

export class SamaritansManager {
    public static readonly shared = new SamaritansManager();

    async createSamaritan(details: {
        name: String;
        email: String;
        image: String;
    }): Promise<CreateSamaritanSuccess | CreateSamaritanFailure> {
        const sid = uuid.v4();
        const username = details.email.split('@')[0] + uuid.v4().substring(0, 5);

        const samaritan: Samaritan = {
            sid,
            name: details.name,
            email: details.email,
            username,
            image: details.image,
            creationDate: Date.now(),
            socialDetails: {
                followersCount: 0,
                followingCount: 0,
            },
            tweetsDetails: {
                tweetsCount: 0,
                retweetsCount: 0
            }
        };

        const collectionRef = DatabaseAssistant.shared.collection(TxDatabaseCollections.samaritans);
        const documentRef = collectionRef.doc(samaritan.sid.valueOf());

        try {
            await documentRef.create(samaritan);

            const result = new CreateSamaritanSuccess({
                samaritan: samaritan
            });
            return result;
        } catch {
            const result = new SamaritanAlreadyExists();
            return result;
        }
    }

    async samaritan(parameters: {
        sid?: String,
        username?: String,
        email?: String,
    }): Promise<Samaritan | null> {
        assert(
            parameters.sid !== undefined || parameters.username !== undefined || parameters.email !== undefined,
            "One of id, username or email has to be present"
        );

        if (parameters.sid !== undefined) {
            const collectionRef = DatabaseAssistant.shared.collection(TxDatabaseCollections.samaritans);
            const documentRef = collectionRef.doc(parameters.sid.valueOf());

            const samaritan = await documentRef.get();

            if (samaritan.exists) {
                const result = samaritan.data() as unknown as Samaritan;
                return result;
            } else {
                const result = null;
                return result;
            }
        }

        if (parameters.username !== undefined) {
            const collectionRef = DatabaseAssistant.shared.collection(TxDatabaseCollections.samaritans);
            const query = collectionRef.where(
                "username",
                "==",
                parameters.username.valueOf(),
            );

            const querySnapshot = await query.get();

            if (querySnapshot.empty) {
                const result = null;
                return result;
            } else {
                const result = querySnapshot.docs[0].data() as unknown as Samaritan;
                return result;
            }
        }

        if (parameters.email !== undefined) {
            const collectionRef = DatabaseAssistant.shared.collection(TxDatabaseCollections.samaritans);
            const query = collectionRef.where(
                "email",
                "==",
                parameters.email.valueOf(),
            );

            const querySnapshot = await query.get();

            if (querySnapshot.empty) {
                const result = null;
                return result;
            } else {
                const result = querySnapshot.docs[0].data() as unknown as Samaritan;
                return result;
            }
        }

        return null;
    }
}