import { Samaritan } from "../../../managers/samaritansManager/models";
import { RouteSuccess } from "../../core/types";

export class SamaritanRouteSuccess extends RouteSuccess {
    static readonly statusCode: 200;

    constructor(samaritan: Samaritan) {
        super(samaritan);
    }
}