import { Google } from "../../assistants/google/google";
import { Either, failure, success } from "../../utils/typescriptx/typescriptx";
import { SamaritansManager } from "../samaritansManager/samaritansManager";
import { SessionsManager } from "../sessionManager/sessionsManager";
import { AuthProvider } from "./models";
import { GoogleLogInFailure, GoogleLogInSuccess, LogInFailure, LogInFailureReason, LogInSuccess, LogOutFailure, LogOutFailureReason, LogOutSuccess } from "./types";

export class AuthManager {
    private static _shared = new AuthManager();
    public static shared = (): AuthManager => this._shared;

    async logIn(parameters: {
        provider: AuthProvider,
        accessToken: String
    }): Promise<Either<LogInSuccess, LogInFailure>> {
        const session = await SessionsManager.shared().session({
            accessToken: parameters.accessToken
        });

        if (session !== null) {
            return success({
                session,
            });
        } else {
            switch (parameters.provider) {
                case AuthProvider.google: {
                    const logInResult = this.logInViaGoogle({
                        accessToken: parameters.accessToken,
                    });

                    return logInResult;
                }
                default: {
                    const logInResult = failure({
                        reason: LogInFailureReason.authProviderUnknown
                    });

                    return logInResult;
                }
            }
        }
    }

    async logOut(parameters: {
        accessToken: String,
    }): Promise<Either<LogOutSuccess, LogOutFailure>> {
        const deleteSessionResult = await SessionsManager.shared().deleteSession({
            accessToken: parameters.accessToken
        });

        const logOutResult = deleteSessionResult.resolve({
            onSuccess: (s) => {
                return success({});
            },
            onFailure: (f) => {
                return failure({
                    reason: LogOutFailureReason.unknown
                });
            },
        });
        
        return logOutResult;
    }

    private async logInViaGoogle(parameters: {
        accessToken: String
    }): Promise<Either<GoogleLogInSuccess, GoogleLogInFailure>> {
        const googleProfile = await Google.shared().details({
            accessToken: parameters.accessToken,
        });

        if (googleProfile !== null) {
            const samaritan = await SamaritansManager.shared().samaritan({
                email: googleProfile.email,
            });

            if (samaritan !== null) {
                const createSessionResult = await SessionsManager.shared().createSession({
                    sid: samaritan.sid,
                    accessToken: parameters.accessToken,
                });

                const logInResult = createSessionResult.resolve({
                    onSuccess: (s) => {
                        const logInResult = success({
                            session: s.session
                        });

                        return logInResult;
                    },
                    onFailure: (f) => {
                        const logInResult = failure({
                            reason: LogInFailureReason.unknown,
                        });

                        return logInResult;
                    }
                });

                return logInResult;
            } else {
                const createSamaritanResult = await SamaritansManager.shared().createSamaritan({
                    name: googleProfile.name,
                    email: googleProfile.email,
                    imageUrl: googleProfile.imageUrl,
                });

                const logInResult = await createSamaritanResult.resolve({
                    onSuccess: async (s) => {
                        const createSessionResult = await SessionsManager.shared().createSession({
                            sid: s.samaritan.sid,
                            accessToken: parameters.accessToken,
                        });

                        return createSessionResult.resolve({
                            onSuccess: (s) => {
                                const logInResult = success({
                                    session: s.session
                                });

                                return logInResult;
                            },
                            onFailure: (f) => {
                                const logInResult = failure({
                                    reason: LogInFailureReason.unknown,
                                });

                                return logInResult;
                            }
                        });
                    },
                    onFailure: async (f) => {
                        const logInResult = failure({
                            reason: LogInFailureReason.unknown,
                        });

                        return logInResult;
                    }
                });

                return logInResult;
            }
        } else {
            const logInResult = failure({
                reason: LogInFailureReason.unknown,
            });

            return logInResult;
        }
    }
}