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
        followersCount: Number;
        followingsCount: Number;
    }
    readonly activityDetails: {
        tweetsCount: Number;
    }
}

export interface ViewableUser extends User {
    viewables: {
        following: Boolean;
    }
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

export interface ViewableFollower {
    readonly viewables: {
        follower: ViewableUser;
    }
}

// Followee
export interface Followee {
    readonly followeeId: String;
    readonly creationDate: String;
}

export interface ViewableFollowee {
    readonly viewables: {
        followee: ViewableUser;
    }
}

// Tweet
export interface Tweet {
    readonly id: String;
    readonly complimentaryId: String;
    readonly text: String;
    readonly authorId: String;
    readonly creationDate: String;
    readonly lastUpdatedDate: String;
    readonly interactionDetails: {
        likesCount: Number;
        commentsCount: Number;
    }
}

export interface ViewableTweet extends Tweet {
    readonly viewables: {
        author: ViewableUser;
        bookmarked: Boolean;
    }
}

// Comment
export interface Comment {
    readonly id: String;
    readonly tweetId: String;
    readonly authorId: String;
    readonly text: String;
    readonly creationDate: String;
}

export interface ViewableComment extends Comment {
    readonly viewables: {
        tweet: ViewableTweet;
        author: ViewableUser;
    }
}

// Like
export interface Like {
    readonly id: String;
    readonly tweetId: String;
    readonly authorId: String;
    readonly creationDate: String;
}

export interface ViewableLike extends Like {
    readonly viewables: {
        tweet: ViewableTweet;
        author: ViewableUser;
    }
}

// Bookmark
export interface Bookmark {
    readonly id: String;
    readonly tweetId: String;
    readonly authorId: String;
    readonly creationDate: String;
}

export interface ViewableBookmark extends Bookmark {
    readonly viewables: {
        tweet: ViewableTweet;
        author: ViewableUser;
    }
}