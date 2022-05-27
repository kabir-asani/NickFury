import { Router, Request, Response } from "express";
import { UnimplementedRouteFailure } from "../../../core/types";
import paginated from "../../../middlewares/paginated/paginated";

const likes = Router({
    mergeParams: true,
});

likes.get("/", paginated(), async (req: Request, res: Response) => {
    const response = new UnimplementedRouteFailure();

    res.status(UnimplementedRouteFailure.statusCode).json(response);
});

likes.post("/", async (req: Request, res: Response) => {
    const response = new UnimplementedRouteFailure();

    res.status(UnimplementedRouteFailure.statusCode).json(response);
});

likes.delete("/:likeId", async (req: Request, res: Response) => {
    const response = new UnimplementedRouteFailure();

    res.status(UnimplementedRouteFailure.statusCode).json(response);
});

export default likes;
