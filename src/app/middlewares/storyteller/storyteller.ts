import logger from "../../../utils/logger/logger";
import { TxMiddleware } from "../core/types";

const storyteller = (): TxMiddleware => (req, res, next) => {
    const details = {
        url: req.originalUrl,
        headers: req.headers,
        queryParameters: req.params,
        body: req.body,
        query: req.query,
    };

    logger('----------REQUEST-----------');
    logger(details);
    logger('----------------------------');

    next();
};

export = storyteller;