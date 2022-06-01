// User
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

export interface UserViewables {
    readonly following: Boolean;
}

export interface ViewableUser extends User {
    readonly viewables: UserViewables;
}

// Session
export interface Session {
    readonly id: String;
    readonly userId: String;
    readonly creationDate: String;
}

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

// Tweet
export interface Tweet {
    readonly id: String;
    readonly externalId: String;
    readonly text: String;
    readonly authorId: String;
    readonly creationDate: String;
    readonly lastUpdatedDate: String;
    readonly interactionDetails: {
        readonly likesCount: Number;
        readonly commentsCount: Number;
    };
}

export interface TweetViewables {
    readonly author: ViewableUser;
    readonly bookmarked: Boolean;
    readonly liked: Boolean;
}

export interface ViewableTweet extends Tweet {
    readonly viewables: TweetViewables;
}

// Comment
export interface Comment {
    readonly id: String;
    readonly tweetId: String;
    readonly authorId: String;
    readonly text: String;
    readonly creationDate: String;
}

export interface CommentViewables {
    readonly author: ViewableUser;
}

export interface ViewableComment extends Comment {
    readonly viewables: CommentViewables;
}

// Like
export interface Like {
    readonly id: String;
    readonly tweetId: String;
    readonly authorId: String;
    readonly creationDate: String;
}

export interface LikeViewables {
    author: ViewableUser;
}

export interface ViewableLike extends Like {
    readonly viewables: LikeViewables;
}

// Bookmark
export interface Bookmark {
    readonly id: String;
    readonly tweetId: String;
    readonly authorId: String;
    readonly creationDate: String;
}

export interface BookmarkViewables {
    readonly tweet: ViewableTweet;
}

export interface ViewableBookmark extends Bookmark {
    readonly viewables: BookmarkViewables;
}
