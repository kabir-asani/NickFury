import { GoogleAssistant } from "../../assistants/google/google";
import { GoogleProfileSuccess, IllegalAccessTokenFailure as IllegalGoogleAccessTokenFailure } from "../../assistants/google/types";
import { SamaritansManager } from "../samaritansManager/samaritansManager";
import { CreateSamaritanSuccess } from "../samaritansManager/types";
import { SessionsManager } from "../sessionManager/sessionsManager";
import { CreateSessionSuccess, DeleteSessionSuccess } from "../sessionManager/types";
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

        if (deleteSessionResult instanceof DeleteSessionSuccess) {
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
            const samaritan = await SamaritansManager.shared.samaritan({
                email: profile.email,
            });

            if (samaritan !== null) {
                const createSessionResult = await SessionsManager.shared.createSession({
                    samaritanId: samaritan.id,
                });

                if (createSessionResult instanceof CreateSessionSuccess) {
                    const session = createSessionResult.session;
                    const result = new LogInSuccess({
                        session: session
                    });

                    return result;
                }

                const result = new UnknownLogInFailure();
                return result;
            } else {
                const createSamaritanResult = await SamaritansManager.shared.createSamaritan({
                    name: profile.name,
                    email: profile.email,
                    image: profile.image,
                });

                if (createSamaritanResult instanceof CreateSamaritanSuccess) {
                    const samaritan = createSamaritanResult.samaritan;
                    const createSessionResult = await SessionsManager.shared.createSession({
                        samaritanId: samaritan.id,
                    });

                    if (createSessionResult instanceof CreateSessionSuccess) {
                        const session = createSessionResult.session;
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