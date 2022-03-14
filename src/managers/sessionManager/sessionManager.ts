import { assert } from "console";
import { Database } from "../../assistants/database/database";
import { Either, failure, success } from "../../utils/typescriptx/typescriptx";
import { CreateSessionFailure, CreateSessionFailureReason, CreateSessionSuccess, Session, ReadSessionFailure, ReadSessionSuccess } from "./types";

class SessionManager {
    private static _shared = new SessionManager();
    public static shared = (): SessionManager => this._shared;

    private static collection = "sessions";

    async createSession(parameters: {
        id: String,
        accessToken: String
    }): Promise<Either<CreateSessionSuccess, CreateSessionFailure>> {
        const writeResult = await Database.shared().write({
            collection: SessionManager.collection,
            document: parameters.id,
            data: {
                accessToken: parameters.accessToken
            }
        });

        return writeResult.resolve({
            onSuccess: (s) => {
                return success({
                    session: {
                        accessToken: parameters.accessToken
                    }
                });
            },
            onFailure: (f) => {
                return failure({
                    reason: CreateSessionFailureReason.unknown
                });
            }
        });
    }
}