import { ViewableUser } from "../models";

export interface Follower {
    readonly id: String;
    readonly creationDate: String;
}

export interface ViewableFollower extends Follower {
    readonly user: ViewableUser;
}

export interface Following {
    readonly id: String;
    readonly creationDate: String;
}

export interface ViewableFollowing extends Following {
    readonly user: ViewableUser;
}