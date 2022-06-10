export interface User {
    readonly id: String;
    readonly name: String;
    readonly email: String;
    readonly username: String;
    readonly description: String;
    readonly image: String;
    readonly creationDate: String;
    readonly lastUpdatedDate: String;
    readonly socialDetails: {
        readonly followersCount: Number;
        readonly followeesCount: Number;
    };
    readonly activityDetails: {
        readonly tweetsCount: Number;
    };
}

export interface ViewableUser extends User {
    readonly viewables: UserViewables;
}

export interface UserViewables {
    readonly following: Boolean;
}
