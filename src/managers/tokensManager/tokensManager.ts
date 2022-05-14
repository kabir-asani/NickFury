import { DatabaseAssistant, DatabaseCollections } from "../../assistants/database/database";
import { Success, Failure, Empty } from "../../utils/typescriptx/typescriptx";
import { UsersManager } from "../usersManager/usersManager";
import { TokenCreationFailureReason, Credentials, TokenDeletionFailureReason, TokenValidationFailureReason } from "./types";
import * as uuid from "uuid";
import { Session } from "../core/models";
import { Dately } from "../../utils/dately/dately";
import { Tokenizer } from "../../utils/tokenizer/tokenizer";

export class TokensManager {
    static readonly shared = new TokensManager();

    private constructor() { }

    async validateAccessToken(parameters: {
        accessToken: String;
    }): Promise<Success<Session> | Failure<TokenValidationFailureReason>> {
        const session = Tokenizer.shared.decode<Session>({
            token: parameters.accessToken
        });

        if (session !== null) {
            const sessionsCollection = DatabaseAssistant.shared.collection(DatabaseCollections.sessions);
            const sessionDocumentRef = sessionsCollection.doc(session.id.valueOf());

            try {
                const sessionDocument = await sessionDocumentRef.get();

                if (sessionDocument.exists) {
                    const reply = new Success<Session>(session);
                    return reply;
                }

                const reply = new Failure<TokenValidationFailureReason>(
                    TokenValidationFailureReason.invalid
                );
                return reply;
            } catch {
                const reply = new Failure<TokenValidationFailureReason>(
                    TokenValidationFailureReason.unknown
                );
                return reply;
            }
        }

        const reply = new Failure<TokenValidationFailureReason>(
            TokenValidationFailureReason.unknown
        );
        return reply;
    }

    async createAccessToken(parameters: {
        credentials: {
            token: String;
            provider: String,
        },
        details: {
            name: String;
            email: String;
            image: String;
        }
    }): Promise<Success<Credentials> | Failure<TokenCreationFailureReason>> {
        const user = await UsersManager.shared.user({
            email: parameters.details.email
        });

        const sessionId = uuid.v4();
        let session: Session;

        if (user !== null) {
            session = {
                id: sessionId,
                userId: user.id,
                creationDate: Dately.shared.now()
            }
        } else {
            const userCreationResult = await UsersManager.shared.createUser({
                email: parameters.details.email,
                image: parameters.details.image,
                name: parameters.details.name
            });

            if (userCreationResult instanceof Failure) {
                const reply = new Failure<TokenCreationFailureReason>(
                    TokenCreationFailureReason.unknown
                );
                return reply;
            }

            session = {
                id: sessionId,
                userId: userCreationResult.data.id,
                creationDate: Dately.shared.now()
            }
        }

        const sessionsCollection = DatabaseAssistant.shared.collection(DatabaseCollections.sessions);
        const sessionDocumentRef = sessionsCollection.doc(session.id.valueOf());

        try {
            await sessionDocumentRef.create(session);

            const accessToken = Tokenizer.shared.encode<Session>({
                payload: session
            });

            const reply = new Success<Credentials>({
                accessToken: accessToken
            });
            return reply;
        } catch {
            const reply = new Failure<TokenCreationFailureReason>(
                TokenCreationFailureReason.unknown
            );
            return reply;
        }
    }

    async deleteAccessToken(parameters: {
        accessToken: String;
    }): Promise<Success<Empty> | Failure<TokenDeletionFailureReason>> {
        const session = Tokenizer.shared.decode<Session>({
            token: parameters.accessToken
        });

        if (session !== null) {
            const sessionsCollection = DatabaseAssistant.shared.collection(DatabaseCollections.sessions);
            const sessionDocumentRef = sessionsCollection.doc(session.id.valueOf());

            try {
                await sessionDocumentRef.delete();

                const reply = new Success<Empty>({});
                return reply;
            } catch {
                const reply = new Failure<TokenDeletionFailureReason>(
                    TokenDeletionFailureReason.unknown
                );
                return reply;
            }
        }

        const reply = new Failure<TokenDeletionFailureReason>(
            TokenDeletionFailureReason.unknown
        );
        return reply;
    }
}