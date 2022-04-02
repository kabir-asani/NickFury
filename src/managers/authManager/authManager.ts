import { GoogleAssistant } from "../../assistants/google/google";
import { UsersManager } from "../usersManager/usersManager";
import { SessionsManager } from "../sessionManager/sessionsManager";
import { AuthProvider } from "./models";
import {
    LogInFailure,
    LogOutFailure,
} from "./types";
import { Empty, Failure, Success } from "../../utils/typescriptx/typescriptx";
import { UserFailure } from "../usersManager/types";
import { GoogleProfileFailure } from "../../assistants/google/types";
import { Session } from "../sessionManager/models";

export class AuthManager {
    public static readonly shared = new AuthManager();

    async logIn(parameters: {
        provider: AuthProvider,
        accessToken: String
    }): Promise<Success<Session> | Failure<LogInFailure>> {
        switch (parameters.provider) {
            case AuthProvider.google: {
                const result = this.logInViaGoogle({
                    accessToken: parameters.accessToken,
                });

                return result;
            }

            default: {
                const result = new Failure<LogInFailure>(LogInFailure.UNKNOWN);

                return result;
            }
        }
    }

    async logOut(parameters: {
        sessionId: String,
    }): Promise<Success<Empty> | Failure<LogOutFailure>> {
        const deleteSessionResult = await SessionsManager.shared.deleteSession({
            sessionId: parameters.sessionId
        });

        if (deleteSessionResult instanceof Success) {
            const result = new Success<Empty>({});
            return result;
        }

        const result = new Failure<LogOutFailure>(LogOutFailure.UNKNOWN);
        return result;
    }

    private async logInViaGoogle(parameters: {
        accessToken: String
    }): Promise<Success<Session> | Failure<LogInFailure>> {
        const profileResult = await GoogleAssistant.shared.profile({
            accessToken: parameters.accessToken,
        });

        if (profileResult instanceof Failure) {
            switch (profileResult.reason) {
                case GoogleProfileFailure.INCORECT_ACCESS_TOKEN: {
                    const result = new Failure<LogInFailure>(LogInFailure.INCORECT_ACCESS_TOKEN);
                    return result;
                }
                default: {
                    const result = new Failure<LogInFailure>(LogInFailure.UNKNOWN);
                    return result;
                }
            }
        }

        const profile = profileResult.data;
        const userResult = await UsersManager.shared.user({
            email: profile.email,
        });

        if (userResult instanceof Failure) {
            switch (userResult.reason) {
                case UserFailure.USER_DOES_NOT_EXISTS: {
                    const createUserResult = await UsersManager.shared.createUser({
                        name: profile.name,
                        email: profile.email,
                        image: profile.image,
                    });

                    if (createUserResult instanceof Failure) {
                        const result = new Failure<LogInFailure>(LogInFailure.UNKNOWN);
                        return result;
                    }

                    const user = createUserResult.data;
                    const createSessionResult = await SessionsManager.shared.createSession({
                        userId: user.id,
                    });

                    if (createSessionResult instanceof Failure) {
                        const result = new Failure<LogInFailure>(LogInFailure.UNKNOWN);
                        return result;
                    }

                    const session = createSessionResult.data;

                    const result = new Success<Session>(session);
                    return result;
                }
                default: {
                    const result = new Failure<LogInFailure>(LogInFailure.UNKNOWN);
                    return result;
                }
            }
        }

        const createSessionResult = await SessionsManager.shared.createSession({
            userId: userResult.data.id,
        });

        if (createSessionResult instanceof Success) {
            const session = createSessionResult.data;

            const result = new Success<Session>(session);
            return result;
        }

        const result = new Failure<LogInFailure>(LogInFailure.UNKNOWN);
        return result;
    }
}