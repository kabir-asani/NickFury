import { Request } from "express";
import { Session } from "../../managers/core/models";

export interface SessionizedRequest extends Request {
    session: Session
}