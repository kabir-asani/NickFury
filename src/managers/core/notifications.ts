import { ViewableTweet } from "./tweet";
import { ViewableUser } from "./user";

export enum NotificationType {
    like = "like",
    comment = "comment",
    follow = "follow",
}

export interface Notification {
    readonly id: String;
    readonly type: NotificationType;
    readonly data: LikeNotification | CommentNotification | FollowNotification;
}

// Like
export interface LikeNotification {
    readonly likeId: String;
    readonly authorId: String;
    readonly tweetId: String;
}

export interface ViewableLikeNotification extends LikeNotification {
    viewables: LikeNotificationViewables;
}

export interface LikeNotificationViewables {
    readonly author: ViewableUser;
    readonly tweet: ViewableTweet;
}

// Comment
export interface CommentNotification {
    readonly commentId: String;
    readonly authorId: String;
    readonly tweetId: String;
}

export interface ViewableCommentNotification extends CommentNotification {
    viewables: CommentNotificationViewables;
}

export interface CommentNotificationViewables {
    readonly author: ViewableUser;
    readonly tweet: ViewableTweet;
}

// Follow
export interface FollowNotification {
    readonly followeeId: String;
    readonly followerId: String;
}

export interface ViewableFollowNotification extends FollowNotification {
    readonly viewables: FollowNotificationViewables;
}

export interface FollowNotificationViewables {
    follower: ViewableUser;
}
