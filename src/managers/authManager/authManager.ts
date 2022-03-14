import { Either, failure, success } from "../../utils/typescriptx/typescriptx";
import { AuthProvider, LogInFailure, LogInFailureReason, LogInSuccess } from "./types";


class AuthManager {
    private static _shared = new AuthManager();
    public static shared = () => this._shared;

    async logIn(parameters: {
        provider: AuthProvider,
        accessToken: String
    }): Promise<Either<LogInSuccess, LogInFailure>> {
        switch (parameters.provider) {
            case AuthProvider.apple:
                // 1. If session is present for this accessToken, return that session.

                // 2. If session is missing, fetch profile-data from Google for this user

                // 3. Check if user is already existing

                // 4. If user is already existing, create a session and return it

                // 5. If user is missig, create a new user, then create a session and return it.
                return success({ session: { accessToken: parameters.accessToken } });
            default:
                return failure({ reason: LogInFailureReason.authProviderUnknown });
        }

    }
}