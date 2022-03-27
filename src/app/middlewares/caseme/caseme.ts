import { camelCasize } from "../../../utils/caser/caser";
import { TxMiddleware } from "../core/types";

export const caseme = (): TxMiddleware => async (req, res, next) => {
    const camelizedQuery = camelCasize(req.query) as { [key: string]: any };
    req.query = camelizedQuery;

    const camelizedBody = camelCasize(req.body);
    req.body = camelizedBody;

    next();
}