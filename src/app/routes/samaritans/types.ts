import { Samaritan } from "../../../managers/samaritansManager/models";
import { Feed } from "../../../managers/tweetsManager/types";
import { RouteSuccess } from "../../core/types";

export class SamaritanRouteSuccess extends RouteSuccess {
    static readonly statusCode: 200;

    constructor(samaritan: Samaritan) {
        super(samaritan);
    }
}

export class FeedRouteSuccess extends RouteSuccess {
    static readonly statusCode: 200;

    constructor(feed: Feed) {
        super(feed);
    }
}