import { assert } from 'console';
import uuid from 'uuid';

import { Database } from "../../assistants/database/database";
import { DatabaseWriteFailureReason } from '../../assistants/database/types';
import { Either, failure, success } from '../../utils/typescriptx/typescriptx';
import { Samaritan } from './models';
import { SamaritanCreateFailure, SamaritanCreateFailureReason, SamaritanCreateSuccess } from './types';

export class SamaritansManager {
    private static _shared = new SamaritansManager();
    public static shared = (): SamaritansManager => this._shared;

    private static collection = "samaritans";

    async createSamaritan(details: {
        name: String;
        email: String;
        imageUrl: String;
    }): Promise<Either<SamaritanCreateSuccess, SamaritanCreateFailure>> {
        const sid = uuid.v4();
        const username = details.email.split('@')[0] + uuid.v4().substring(4);

        const samaritan: Samaritan = {
            sid,
            name: details.name,
            email: details.email,
            username,
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
        };

        const writeResult = await Database.shared().write({
            collection: SamaritansManager.collection,
            document: samaritan.sid,
            data: samaritan,
        });

        return writeResult.resolve({
            onSuccess: (s) => {
                return success({
                    samaritan
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
    }): Promise<Samaritan | null> {
        assert(
            parameters.id !== undefined || parameters.username !== undefined || parameters.email !== undefined,
            "One of id, username or email has to be present"
        );

        if (parameters.id !== undefined) {
            const samaritan = await Database.shared().read<Samaritan>({
                collection: SamaritansManager.collection,
                document: parameters.id,
            });

            return samaritan;
        }

        if (parameters.username !== undefined) {
            const samaritans = await Database.shared().readAll<Samaritan>({
                collection: SamaritansManager.collection,
                where: {
                    operandOne: "username",
                    operator: "==",
                    operandTwo: parameters.username,
                }
            });

            if (samaritans !== null) {
                return samaritans[0];
            } else {
                return null;
            }
        }

        if (parameters.email !== undefined) {
            const samaritans = await Database.shared().readAll<Samaritan>({
                collection: SamaritansManager.collection,
                where: {
                    operandOne: "email",
                    operator: "==",
                    operandTwo: parameters.email,
                }
            });
            if (samaritans !== null) {
                return samaritans[0];
            } else {
                return null;
            }
        }

        return null;
    }
}