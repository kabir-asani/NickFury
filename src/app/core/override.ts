import { Request } from "express";

export interface SessionizedRequest extends Request {
    session: {
        sessionId: String;
        userId: String;
    }
}