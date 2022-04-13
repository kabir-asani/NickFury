export interface User {
    readonly id: String;
    readonly name: String;
    readonly email: String;
    readonly username: String;
    readonly image: String;
    readonly creationDate: String;
    readonly socialDetails: {
        readonly followersCount: Number;
        readonly followingsCount: Number;
    };
    readonly activityDetails: {
        readonly tweetsCount: Number;
    };
}

export interface ViewableUser {
    viewables: {
        follower: Boolean;
    };
}