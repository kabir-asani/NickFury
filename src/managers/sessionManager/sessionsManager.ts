import * as uuid from "uuid";
import { DatabaseAssistant } from "../../assistants/database/database";
import { TxDatabaseCollections } from "../core/collections";
import { Session } from "./models";
import {
    CreateSessionFailure,
    DeleteSessionFailure,
    SessionFailure,
} from "./types";
import { Empty, Failure, Success } from "../../utils/typescriptx/typescriptx";
import { Tokenizer } from "../../utils/tokenizer/tokenizer";

export class SessionsManager {
    public static readonly shared = new SessionsManager();

    private constructor() { }

    async exists(parameters: {
        sessionId: String,
    }): Promise<Boolean> {
        const collectionRef = DatabaseAssistant.shared.collection(TxDatabaseCollections.sessions);
        const documentRef = collectionRef.doc(parameters.sessionId.valueOf());

        const sesison = await documentRef.get();

        if (sesison.exists) {
            return true;
        } else {
            return false;
        }
    }

    async createSession(parameters: {
        userId: String;
    }): Promise<Success<String> | Failure<CreateSessionFailure>> {
        const deleteSessionResult = await this.deleteSessions({
            userId: parameters.userId
        });


        if (deleteSessionResult instanceof Success) {
            const id = uuid.v4();

            const session: Session = {
                id: id,
                userId: parameters.userId
            };

            const sessionsCollectionRef = DatabaseAssistant.shared.collection(TxDatabaseCollections.sessions);
            const sessionDocumentRef = sessionsCollectionRef.doc(session.id.valueOf());

            try {
                const accessToken = Tokenizer.shared.token({
                    payload: session
                });

                await sessionDocumentRef.create(session);

                const result = new Success<String>(accessToken);
                return result;
            } catch {
                const result = new Failure<CreateSessionFailure>(CreateSessionFailure.UNKNOWN);
                return result;
            }
        }

        const result = new Failure<CreateSessionFailure>(CreateSessionFailure.UNKNOWN);
        return result;
    }

    async session(parameters: {
        sessionId: String,
    }): Promise<Success<Session> | Failure<SessionFailure>> {
        const collectionRef = DatabaseAssistant.shared.collection(TxDatabaseCollections.sessions);

        const query = collectionRef.where(
            "id",
            "==",
            parameters.sessionId.valueOf()
        );

        try {
            const querySnapshot = await query.get();

            if (!querySnapshot.empty) {
                const session = querySnapshot.docs[0].data() as unknown as Session;

                const result = new Success<Session>(session);

                return result;
            }

            const result = new Failure<SessionFailure>(SessionFailure.SESSION_DOES_NOT_EXISTS);
            return result;
        } catch {
            const result = new Failure<SessionFailure>(SessionFailure.UNKNOWN);
            return result;
        }
    }

    async deleteSession(parameters: {
        sessionId: String
    }): Promise<Success<Empty> | Failure<DeleteSessionFailure>> {
        const collectionRef = DatabaseAssistant.shared.collection(TxDatabaseCollections.sessions);

        const query = collectionRef.where(
            "id",
            "==",
            parameters.sessionId.valueOf()
        );

        try {
            const querySnapshot = await query.get();

            const batch = DatabaseAssistant.shared.batch();

            querySnapshot.docs.forEach((doc) => {
                const docRef = doc.ref;

                batch.delete(docRef);
            });

            await batch.commit();

            const result = new Success<Empty>({});

            return result;
        } catch {
            const result = new Failure<DeleteSessionFailure>(DeleteSessionFailure.UNKNOWN);
            return result;
        }
    }

    private async deleteSessions(parameters: {
        userId: String,
    }): Promise<Success<Empty> | Failure<DeleteSessionFailure>> {
        const collectionRef = DatabaseAssistant.shared.collection(TxDatabaseCollections.sessions);

        const query = collectionRef.where(
            "userId",
            "==",
            parameters.userId.valueOf()
        );

        const querySnapshot = await query.get();

        try {
            const batch = DatabaseAssistant.shared.batch();

            for (const queryDocument of querySnapshot.docs) {
                const documentRef = queryDocument.ref;
                batch.delete(documentRef);
            }

            await batch.commit();

            const result = new Success<Empty>({});
            return result;
        } catch {
            const result = new Failure<DeleteSessionFailure>(DeleteSessionFailure.UNKNOWN);
            return result;
        }
    }
}