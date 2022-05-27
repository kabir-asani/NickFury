import { NextFunction, Response, Request } from "express";

type TxMiddleware = (req: Request, res: Response, next: NextFunction) => void;

export default TxMiddleware;
