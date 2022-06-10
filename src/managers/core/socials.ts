import { ViewableUser } from "./user";

// Follower
export interface Follower {
    readonly followerId: String;
    readonly creationDate: String;
}

export interface ViewableFollower {
    readonly viewables: FollowerViewables;
}

export interface FollowerViewables {
    readonly follower: ViewableUser;
}

// Followee
export interface Followee {
    readonly followeeId: String;
    readonly creationDate: String;
}

export interface ViewableFollowee {
    readonly viewables: FolloweeViewables;
}

export interface FolloweeViewables {
    readonly followee: ViewableUser;
}
