import { ViewableUser } from "./user";

// Follower
export interface Follower {
    readonly followerId: String;
    readonly creationDate: String;
}

export interface FollowerViewables {
    readonly follower: ViewableUser;
}

export interface ViewableFollower {
    readonly viewables: FollowerViewables;
}

// Followee
export interface Followee {
    readonly followeeId: String;
    readonly creationDate: String;
}

export interface FolloweeViewables {
    readonly followee: ViewableUser;
}

export interface ViewableFollowee {
    readonly viewables: FolloweeViewables;
}
