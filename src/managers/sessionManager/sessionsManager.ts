import { assert } from "console";
import { DatabaseAssistant } from "../../assistants/database/database";
import { StreamAssistant } from "../../assistants/stream/stream";
import { TxDatabaseCollections } from "../core/collections";
import { Session } from "./models";
import {
    CreateSessionFailure,
    CreateSessionSuccess,
    DeleteSessionSuccess,
    DeleteSessionFailure,
    UnkknownDeleteSessionFailure,
    SessionAlreadyPresentFailure
} from "./types";

export class SessionsManager {
    public static readonly shared = new SessionsManager();

    async exists(parameters: {
        sid?: String,
        accessToken?: String,
    }): Promise<Boolean> {
        assert(
            parameters.sid !== undefined || parameters.accessToken !== undefined,
            "Either one of sid or accessToken should be present"
        );

        if (parameters.sid !== undefined) {
            const collectionRef = DatabaseAssistant.shared.collection(TxDatabaseCollections.sessions);
            const documentRef = collectionRef.doc(parameters.sid.valueOf());

            const sesison = await documentRef.get();

            const isSessionExisting = sesison.exists;
            return isSessionExisting;
        }

        if (parameters.accessToken !== undefined) {
            const collectionRef = DatabaseAssistant.shared.collection(TxDatabaseCollections.sessions);
            const query = collectionRef.where(
                "accessToken",
                "==",
                parameters.accessToken.valueOf()
            );

            const querySnapshot = await query.get();

            const isSessionExisting = !querySnapshot.empty;
            return isSessionExisting;
        }

        return false;
    }

    async createSession(parameters: {
        sid: String,
        accessToken: String
    }): Promise<CreateSessionSuccess | CreateSessionFailure> {
        const collectionRef = DatabaseAssistant.shared.collection(TxDatabaseCollections.sessions);
        const documentRef = collectionRef.doc(parameters.sid.valueOf());

        const document = await documentRef.get();

        if (document.exists) {
            const session = document.data() as unknown as Session;

            if (session.accessToken === parameters.accessToken) {
                const result = new CreateSessionSuccess({
                    session: session,
                });
                return result;
            }
        }

        const session: Session = {
            sid: parameters.sid,
            accessToken: parameters.accessToken,
            feedToken: StreamAssistant.shared.token({
                sid: parameters.sid
            }),
            creationDate: Date.now(),
        };

        try {
            await documentRef.create(session);

            const result = new CreateSessionSuccess({
                session: session
            });
            return result;
        } catch {
            const result = new SessionAlreadyPresentFailure();
            return result;
        }
    }

    async session(parameters: {
        sid?: String,
        accessToken?: String,
    }): Promise<Session | null> {
        assert(
            parameters.sid !== undefined || parameters.accessToken !== undefined,
            "Either one of sid or accessToken should be present"
        );

        if (parameters.sid !== undefined) {
            const collectionRef = DatabaseAssistant.shared.collection(TxDatabaseCollections.sessions);
            const documentRef = collectionRef.doc(parameters.sid.valueOf());

            const document = await documentRef.get();

            if (document.exists) {
                const result = document.data() as unknown as Session;
                return result;
            } else {
                const result = null;
                return result;
            }
        }

        if (parameters.accessToken !== undefined) {
            const collectionRef = DatabaseAssistant.shared.collection(TxDatabaseCollections.sessions);
            const query = collectionRef.where(
                "accessToken",
                "==",
                parameters.accessToken.valueOf(),
            );

            const querySnapshot = await query.get();

            if (querySnapshot.empty) {
                const result = null;
                return result;
            } else {
                const result = querySnapshot.docs[0].data() as unknown as Session;
                return result;
            }
        }

        return null;
    }

    async deleteSession(parameters: {
        accessToken: String,
    }): Promise<DeleteSessionSuccess | DeleteSessionFailure> {
        const collectionRef = DatabaseAssistant.shared.collection(TxDatabaseCollections.sessions);
        const query = collectionRef.where(
            "accessToken",
            "==",
            parameters.accessToken.valueOf(),
        );

        const querySnapshot = await query.get();

        try {
            const batch = DatabaseAssistant.shared.batch();

            querySnapshot.docs.forEach((queryDocumentSnapshotRef) => {
                batch.delete(queryDocumentSnapshotRef.ref);
            });

            await batch.commit();

            const result = new DeleteSessionSuccess();
            return result;
        } catch {
            const result = new UnkknownDeleteSessionFailure();
            return result;
        }
    }
}