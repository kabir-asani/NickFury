import { UsersManager } from "../usersManager/usersManager";
import { SessionsManager } from "../sessionsManager/sessionsManager";
import { AuthProvider } from "./models";
import {
    LogInFailure,
    LogOutFailure,
} from "./types";
import { Empty, Failure, Success } from "../../utils/typescriptx/typescriptx";
import { UserFailure } from "../usersManager/types";
import { User } from "../usersManager/models";

export class AuthenticationManager {
    public static readonly shared = new AuthenticationManager();

    private constructor() { }

    async logIn(parameters: {
        details: {
            name: String;
            email: String;
            image: String;
        },
        credentials: {
            provider: AuthProvider;
            token: String;
        }
    }): Promise<Success<String> | Failure<LogInFailure>> {
        // TODO: Verify access-token from Google or Apple
        const isTokenValid = true;

        if (isTokenValid) {
            let user: User;

            const userResult = await UsersManager.shared.user({
                email: parameters.details.email
            });

            if (userResult instanceof Failure) {
                switch (userResult.reason) {
                    case UserFailure.USER_DOES_NOT_EXISTS: {
                        const createUserResult = await UsersManager.shared.createUser({
                            name: parameters.details.name,
                            email: parameters.details.email,
                            image: parameters.details.image,
                        });

                        if (createUserResult instanceof Failure) {
                            const result = new Failure<LogInFailure>(LogInFailure.UNKNOWN);
                            return result;
                        }

                        user = createUserResult.data;
                    }
                    default: {
                        const result = new Failure<LogInFailure>(LogInFailure.UNKNOWN);
                        return result;
                    }
                }
            } else {
                user = userResult.data;
            }

            const createSessionResult = await SessionsManager.shared.createSession({
                userId: user.id
            });

            if (createSessionResult instanceof Failure) {
                const result = new Failure<LogInFailure>(LogInFailure.UNKNOWN);
                return result;
            }

            const result = new Success<String>(createSessionResult.data);
            return result;
        } else {
            const result = new Failure<LogInFailure>(LogInFailure.INCORECT_ACCESS_TOKEN);
            return result;
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
}