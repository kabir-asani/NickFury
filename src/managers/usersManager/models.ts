export interface User {
    readonly id: String;
    readonly name: String;
    readonly email: String;
    readonly username: String;
    readonly image: String;
    readonly creationDate: String;
    readonly socialDetails: {
        readonly followersCount: Number;
        readonly followingCount: Number;
    };
    readonly tweetsDetails: {
        readonly tweetsCount: Number;
    };
}

export interface UserViewerMeta {
    follower: Boolean;
}

export interface ViewableUser {
    viewerMeta: UserViewerMeta;
}