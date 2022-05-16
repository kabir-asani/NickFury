import { UsersManager } from "../../../../managers/usersManager/usersManager";
import { NoResourceRouteFailure } from "../../../core/types";
import { TxMiddleware } from "../../../middlewares/core/types";

export const userExistentialGuard = (): TxMiddleware =>
    async (req, res, next) => {
        const userId = req.params.userId as String;

        const isUserExists = await UsersManager.shared.exists({
            id: userId
        });

        if (isUserExists) {
            next();
        } else {
            const response = new NoResourceRouteFailure();

            res
                .status(NoResourceRouteFailure.statusCode)
                .json(response);
        }
    }