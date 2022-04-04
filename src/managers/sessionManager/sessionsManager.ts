import * as uuid from "uuid";
import { assert } from "console";
import { DatabaseAssistant } from "../../assistants/database/database";
import { TxCollections } from "../core/collections";
import { Session } from "./models";
import {
    CreateSessionFailure,
    DeleteSessionFailure,
    SessionFailure,
} from "./types";
import { Dately } from "../../utils/dately/dately";
import { Empty, Failure, Success } from "../../utils/typescriptx/typescriptx";

export class SessionsManager {
    public static readonly shared = new SessionsManager();

    async exists(parameters: {
        sessionId: String,
    }): Promise<Boolean> {
        const collectionRef = DatabaseAssistant.shared.collection(TxCollections.sessions);
        const documentRef = collectionRef.doc(parameters.sessionId.valueOf());

        const sesison = await documentRef.get();

        if (sesison.exists) {
            return true;
        } else {
            return false;
        }
    }

    async createSession(parameters: {
        userId: String,
    }): Promise<Success<Session> | Failure<CreateSessionFailure>> {
        const deleteSessionResult = await this.deleteSessions({
            userId: parameters.userId
        });

        if (deleteSessionResult instanceof Success) {
            const session: Session = {
                id: uuid.v4(),
                userId: parameters.userId,
                creationDate: Dately.shared.now(),
            };

            const collectionRef = DatabaseAssistant.shared.collection(TxCollections.sessions);
            const documentRef = collectionRef.doc(session.id.valueOf());

            try {
                await documentRef.create(session);

                const result = new Success<Session>(session);
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
        const collectionRef = DatabaseAssistant.shared.collection(TxCollections.sessions);
        const documentRef = collectionRef.doc(parameters.sessionId.valueOf());

        try {
            const document = await documentRef.get();

            if (document.exists) {
                const session = document.data() as unknown as Session;

                const result = new Success<Session>(session);
                return result;
            } else {
                const result = new Failure<SessionFailure>(SessionFailure.SESSION_DOES_NOT_EXISTS);
                return result;
            }
        } catch {
            const result = new Failure<SessionFailure>(SessionFailure.UNKNOWN);
            return result;
        }
    }

    async deleteSession(parameters: {
        sessionId: String
    }): Promise<Success<Empty> | Failure<DeleteSessionFailure>> {
        const collectionRef = DatabaseAssistant.shared.collection(TxCollections.sessions);
        const documentRef = collectionRef.doc(parameters.sessionId.valueOf());


        try {
            await documentRef.delete();

            const result = new Success<Empty>({});
            return result;
        } catch {
            const result = new Failure<DeleteSessionFailure>(DeleteSessionFailure.UNKNOWN);
            return result;
        }
    }

    async deleteSessions(parameters: {
        userId: String,
    }): Promise<Success<Empty> | Failure<DeleteSessionFailure>> {
        const collectionRef = DatabaseAssistant.shared.collection(TxCollections.sessions);
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