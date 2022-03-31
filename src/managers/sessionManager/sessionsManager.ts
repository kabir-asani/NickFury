import * as uuid from "uuid";
import { assert } from "console";
import { DatabaseAssistant } from "../../assistants/database/database";
import { TxDatabaseCollections } from "../core/collections";
import { Session } from "./models";
import {
    CreateSessionFailure,
    CreateSessionSuccess,
    DeleteSessionSuccess,
    DeleteSessionFailure,
    UnkknownDeleteSessionFailure,
    UnknownCreateSessionFailure,
    DeleteAllExistingSessionsSuccess,
    DeleteAllExistingSessionsFailure,
    UnknownDeleteAllExistingSessionsFailure
} from "./types";

export class SessionsManager {
    public static readonly shared = new SessionsManager();

    async exists(parameters: {
        sessionId: String,
    }): Promise<Boolean> {
        const collectionRef = DatabaseAssistant.shared.collection(TxDatabaseCollections.sessions);
        const documentRef = collectionRef.doc(parameters.sessionId.valueOf());

        const sesison = await documentRef.get();

        const isSessionExists = sesison.exists;
        return isSessionExists;
    }

    async createSession(parameters: {
        samaritanId: String,
    }): Promise<CreateSessionSuccess | CreateSessionFailure> {
        const existingSessionsDeleteResult = await this.deleteAllExistingSessions({
            samaritanId: parameters.samaritanId
        });

        if (existingSessionsDeleteResult instanceof DeleteAllExistingSessionsSuccess) {
            const session: Session = {
                sessionId: uuid.v4(),
                samaritanId: parameters.samaritanId,
                creationDate: Date.now(),
            };
    
            const collectionRef = DatabaseAssistant.shared.collection(TxDatabaseCollections.sessions);
            const documentRef = collectionRef.doc(session.sessionId.valueOf());
    
            try {
                await documentRef.create(session);
    
                const result = new CreateSessionSuccess({
                    session: session
                });
                return result;
            } catch {
                const result = new UnknownCreateSessionFailure();
                return result;
            }
        }


        const result = new UnknownCreateSessionFailure();
        return result;
    }

    async session(parameters: {
        sessionId: String,
    }): Promise<Session | null> {
        const collectionRef = DatabaseAssistant.shared.collection(TxDatabaseCollections.sessions);
        const documentRef = collectionRef.doc(parameters.sessionId.valueOf());

        const document = await documentRef.get();

        if (document.exists) {
            const result = document.data() as unknown as Session;
            return result;
        } else {
            const result = null;
            return result;
        }
    }

    async deleteSession(parameters: {
        sessionId: String,
    }): Promise<DeleteSessionSuccess | DeleteSessionFailure> {
        const collectionRef = DatabaseAssistant.shared.collection(TxDatabaseCollections.sessions);
        const documentRef = collectionRef.doc(parameters.sessionId.valueOf());

        try {
            await documentRef.delete();

            const result = new DeleteSessionSuccess();
            return result;
        } catch {
            const result = new UnkknownDeleteSessionFailure();
            return result;
        }
    }

    private async deleteAllExistingSessions(parameters: {
        samaritanId: String
    }): Promise<DeleteAllExistingSessionsSuccess | DeleteAllExistingSessionsFailure > {
        const collectionRef = DatabaseAssistant.shared.collection(TxDatabaseCollections.sessions);

        const query = collectionRef.where(
            "samaritanId",
            "==",
            parameters.samaritanId.valueOf()
        );

        const querySnapshot = await query.get();

        try {
            const batch = DatabaseAssistant.shared.batch();

            for (const queryDocument of querySnapshot.docs) {
                const documentRef = queryDocument.ref;

                batch.delete(documentRef);
            }

            await batch.commit();
            
            const result = new DeleteAllExistingSessionsSuccess();
            return result;
        } catch {
            const result = new UnknownDeleteAllExistingSessionsFailure();
            return result;
        }
    }
}