import { NextFunction, Response, Request } from 'express';

export type TxMiddleware = (req: Request, res: Response, next: NextFunction) => void;