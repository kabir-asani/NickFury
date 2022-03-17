import { assert } from "console";
import { Database } from "../../assistants/database/database";
import { Either, failure, success } from "../../utils/typescriptx/typescriptx";
import { Session } from "./models";
import { CreateSessionFailure, CreateSessionFailureReason, CreateSessionSuccess, DeleteSessionSuccess, DeleteSessionFailure, DeleteSessionFailureReason } from "./types";

export class SessionsManager {
    private static _shared = new SessionsManager();
    public static shared = (): SessionsManager => this._shared;

    private static collection = "sessions";

    async exists(parameters: {
        sid?: String,
        accessToken?: String,
    }): Promise<Boolean> {
        assert(
            parameters.sid !== undefined || parameters.accessToken !== undefined,
            "Either one of sid or accessToken should be present"
        );

        if (parameters.sid !== undefined) {
            const isSessionExisting = await Database.shared().exists({
                collection: SessionsManager.collection,
                document: parameters.sid
            });

            return isSessionExisting;
        }

        if (parameters.accessToken !== undefined) {
            const isSessionExisting = await Database.shared().existsAny({
                collection: SessionsManager.collection,
                where: {
                    operandOne: "accessToken",
                    operator: "==",
                    operandTwo: parameters.accessToken
                }
            });

            return isSessionExisting;
        }

        return false;
    }

    async createSession(parameters: {
        sid: String,
        accessToken: String
    }): Promise<Either<CreateSessionSuccess, CreateSessionFailure>> {
        const session: Session = {
            sid: parameters.sid,
            accessToken: parameters.accessToken,
            creationDate: Date.now(),
        };

        const writeResult = await Database.shared().write<Session>({
            collection: SessionsManager.collection,
            document: parameters.sid,
            data: session,
            overwrite: true,
        });

        return writeResult.resolve({
            onSuccess: (s) => {
                return success({
                    session,
                });
            },
            onFailure: (f) => {
                return failure({
                    reason: CreateSessionFailureReason.unknown,
                });
            }
        });
    }

    async session(parameters: {
        sid?: String,
        accessToken?: String,
    }): Promise<Session | null> {
        if (parameters.sid !== undefined) {
            const session = await Database.shared().read<Session>({
                collection: SessionsManager.collection,
                document: parameters.sid,
            });

            return session;
        }

        if (parameters.accessToken !== undefined) {
            const sessions = await Database.shared().readAll<Session>({
                collection: SessionsManager.collection,
                where: {
                    operandOne: "accessToken",
                    operator: "==",
                    operandTwo: parameters.accessToken
                }
            });

            if (sessions !== null) {
                return sessions[0];
            } else {
                return null;
            }
        }

        return null;
    }

    async deleteSession(parameters: {
        accessToken: String,
    }): Promise<Either<DeleteSessionSuccess, DeleteSessionFailure>> {
        const deleteResult = await Database.shared().deleteAll({
            collection: SessionsManager.collection,
            where: {
                operandOne: "accessToken",
                operator: "==",
                operandTwo: parameters.accessToken,
            }
        });

        return deleteResult.resolve({
            onSuccess: (s) => {
                return success({
                });
            },
            onFailure: (f) => {
                return failure({
                    reason: DeleteSessionFailureReason.unknown
                });
            }
        });
    }
}