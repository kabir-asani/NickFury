import { GoogleAssistant } from "../../assistants/google/google";
import { GoogleProfileSuccess, IllegalAccessTokenFailure as IllegalGoogleAccessTokenFailure } from "../../assistants/google/types";
import { UsersManager } from "../usersManager/usersManager";
import { SessionsManager } from "../sessionManager/sessionsManager";
import { AuthProvider } from "./models";
import {
    LogInSuccess,
    LogInFailure,
    LogOutSuccess,
    LogOutFailure,
    UnknownAuthProvider,
    UnknownLogInFailure,
    IncorrectAccessTokenFailure,
    UnknownLogOutFailure,
} from "./types";
import { Success } from "../../utils/typescriptx/typescriptx";

export class AuthManager {
    public static readonly shared = new AuthManager();

    async logIn(parameters: {
        provider: AuthProvider,
        accessToken: String
    }): Promise<LogInSuccess | LogInFailure> {
        switch (parameters.provider) {
            case AuthProvider.google: {
                const result = this.logInViaGoogle({
                    accessToken: parameters.accessToken,
                });

                return result;
            }

            default: {
                const result = new UnknownAuthProvider();

                return result;
            }
        }
    }

    async logOut(parameters: {
        sessionId: String,
    }): Promise<LogOutSuccess | LogOutFailure> {
        const deleteSessionResult = await SessionsManager.shared.deleteSession({
            sessionId: parameters.sessionId
        });

        if (deleteSessionResult instanceof Success) {
            const result = new LogOutSuccess();
            return result;
        }

        const result = new UnknownLogOutFailure();
        return result;
    }

    private async logInViaGoogle(parameters: {
        accessToken: String
    }): Promise<LogInSuccess | LogInFailure> {
        const profileResult = await GoogleAssistant.shared.profile({
            accessToken: parameters.accessToken,
        });

        if (profileResult instanceof GoogleProfileSuccess) {
            const profile = profileResult.profile;
            const user = await UsersManager.shared.user({
                email: profile.email,
            });

            if (user !== null) {
                const createSessionResult = await SessionsManager.shared.createSession({
                    userId: user.id,
                });

                if (createSessionResult instanceof Success) {
                    const session = createSessionResult.data;
                    const result = new LogInSuccess({
                        session: session
                    });

                    return result;
                }

                const result = new UnknownLogInFailure();
                return result;
            } else {
                const createUserResult = await UsersManager.shared.createUser({
                    name: profile.name,
                    email: profile.email,
                    image: profile.image,
                });

                if (createUserResult instanceof Success) {
                    const user = createUserResult.data;
                    const createSessionResult = await SessionsManager.shared.createSession({
                        userId: user.id,
                    });

                    if (createSessionResult instanceof Success) {
                        const session = createSessionResult.data;
                        const result = new LogInSuccess({
                            session: session
                        });

                        return result;
                    }

                    const result = new UnknownLogInFailure();
                    return result;
                }

                const result = new UnknownLogInFailure();
                return result;
            }
        }

        if (profileResult instanceof IllegalGoogleAccessTokenFailure) {
            const result = new IncorrectAccessTokenFailure();
            return result;
        }

        const result = new UnknownLogInFailure();
        return result;
    }
}