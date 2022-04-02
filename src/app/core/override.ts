import { Request } from "express";
import { Session } from "../../managers/sessionManager/models";

export interface SessionizedRequest extends Request {
    session: Session
}