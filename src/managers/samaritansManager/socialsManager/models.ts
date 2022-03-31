import { Samaritan } from "../models";

export interface Follower {
    readonly followerId: String;
}

export interface EnrichedFollower extends Follower {
    readonly follower: Samaritan;
}

export interface Following {
    readonly followingId: String;
}

export interface EnrichedFollowing extends Following {
    readonly following: Samaritan;
}
