import { ForbiddenRouteFailure } from "../../core/types";
import TxMiddleware from "../core/types";

const selfishGuard = (): TxMiddleware => async (req, res, next) => {
    if (req.originalUrl.startsWith("/users/self")) {
        next();
    } else {
        const response = new ForbiddenRouteFailure();

        res.status(ForbiddenRouteFailure.statusCode).json(response);
    }
};

export default selfishGuard;
