import { StreamAssistant } from "../../assistants/stream/stream";
import { Tweet } from "../core/models";
import { Paginated, PaginationParameters } from "../core/types";

export class TimelinesManager {
    static readonly shared = new TimelinesManager();

    private constructor() { }

    async timeline(parameters: {
        userId: String
    } & PaginationParameters): Promise<Paginated<Tweet> | null> {
        // TODO: Implement `TimelinesManager.timeline`

        const activities = await StreamAssistant.shared.timelineFeed.activities({
            userId: parameters.userId,
            nextToken: parameters.nextToken,
            limit: parameters.limit,
        });

        return null;
    }
}