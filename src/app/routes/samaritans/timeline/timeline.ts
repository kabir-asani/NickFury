import { Router, Request, Response } from "express";
import paginated from "../../../middlewares/paginated/paginated";
const timeline = Router();

timeline.get(
    "/",
    paginated(),
    async (req: Request, res: Response) => {
        // TODO: Implement this route
        throw Error("Unimplemented");
    },
);

export = timeline;