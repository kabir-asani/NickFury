import { UnauthenticatedRouteFailure } from "../../core/types";
import { TxMiddleware } from "../core/types";
import { SessionizedRequest } from "../../core/override";
import { TokensManager } from "../../../managers/tokensManager/tokensManager";

export const gatekeeper = (): TxMiddleware =>
    async (req, res, next) => {
        const authorization = req.headers.authorization;

        if (authorization !== undefined && authorization.startsWith("Bearer ")) {
            const accessToken = authorization.substring(7);

            const session = await TokensManager.shared.validateAccessToken({
                accessToken: accessToken
            });

            if (session != null) {
                const sessionizedRequest = req as unknown as SessionizedRequest;
                sessionizedRequest.session = session;

                return next();
            }
        }

        const response = new UnauthenticatedRouteFailure();

        res
            .status(UnauthenticatedRouteFailure.statusCode)
            .json(response);
    }
