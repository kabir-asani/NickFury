import { assert } from 'console';
import uuid from 'uuid';

import { Database } from "../../assistants/database/database";
import { DatabaseWriteFailureReason } from '../../assistants/database/types';
import { Either, failure, success } from '../../utils/typescriptx/typescriptx';
import { SamaritanCreateFailure, SamaritanCreateFailureReason, SamaritanCreateSuccess, SamaritanReadFailure, Samaritan, SamaritanReadSuccess, SamaritanReadFailureReason } from './types';

class SamaritansManager {
    private static _shared = new SamaritansManager();
    public static shared = (): SamaritansManager => this._shared;

    private static collection = "samaritans";

    async createSamaritan(details: {
        name: String;
        email: String;
        imageUrl: String;
    }): Promise<Either<SamaritanCreateSuccess, SamaritanCreateFailure>> {
        const samaritan: Samaritan = {
            sid: uuid.v4(),
            name: details.name,
            email: details.email,
            username: details.email.split('@')[0] + uuid.v4().substring(4),
            image: details.imageUrl,
            creationDate: Date.now(),
            socialDetails: {
                followersCount: 0,
                followingCount: 0,
            },
            tweetsDetails: {
                tweetsCount: 0,
                retweetsCount: 0
            }
        }

        const writeResult = await Database.shared().write({
            collection: SamaritansManager.collection,
            document: samaritan.sid,
            data: samaritan,
        });

        return writeResult.resolve({
            onSuccess: (s) => {
                return success({
                    samaritan: samaritan
                });
            },
            onFailure: (f) => {
                switch (f.reason) {
                    case DatabaseWriteFailureReason.documentCannotBeOverwritten:
                        return failure({
                            reason: SamaritanCreateFailureReason.samaritanAlreadyPresent
                        });
                    default:
                        return failure({
                            reason: SamaritanCreateFailureReason.unknown
                        });
                }

            }
        });
    }

    async samaritan(parameters: {
        id?: String,
        username?: String,
        email?: String,
    }): Promise<Either<SamaritanReadSuccess, SamaritanReadFailure>> {
        assert(
            parameters.id !== undefined || parameters.username !== undefined || parameters.email !== undefined,
            "Either id, username or email have to be present"
        );

        if (parameters.id !== undefined) {
            // TODO: Fetch via id
        }

        if (parameters.username !== undefined) {
            // TODO: Fetch via username
        }

        if (parameters.email !== undefined) {
            // TODO: Fetch via email
        }

        return failure({
            reason: SamaritanReadFailureReason.unknwon
        });
    }
}