import { DatabaseAssistant } from "../../../assistants/database/database";
import { StreamAssistant } from "../../../assistants/stream/stream";
import { Dately } from "../../../utils/dately/dately";
import { Empty, Failure, Success } from "../../../utils/typescriptx/typescriptx";
import { TxCollections } from "../../core/collections";
import { PaginationQuery, Paginated } from "../../core/types";
import { User } from "../models";
import { UsersManager } from "../usersManager";
import { Following, Follower } from "./models";
import {
    FollowersFeedFailure,
    FollowFailure,
    FollowingsFeedFailure,
    UnfollowFailure,
} from "./types";

export class SocialsManager {
    public static readonly shared = new SocialsManager();

    async exists(parameters: {
        followingUserId: String;
        followerUserId: String;
    }): Promise<Boolean> {
        const isFollowing = await this.isFollowing(parameters);

        if (isFollowing) {
            return true;
        } else {
            return false;
        }
    }

    async follow(parameters: {
        followingUserId: String;
        followerUserId: String;
    }): Promise<Success<Empty> | Failure<FollowFailure>> {
        const isFollowingUserExists = await UsersManager.shared.exists({
            userId: parameters.followingUserId,
        });
        const isFollowerUserExists = await UsersManager.shared.exists({
            userId: parameters.followerUserId,
        });

        if (!isFollowingUserExists) {
            const result = new Failure<FollowFailure>(FollowFailure.FOLLOWING_DOES_NOT_EXISTS);
            return result;
        }

        if (!isFollowerUserExists) {
            const result = new Failure<FollowFailure>(FollowFailure.FOLLOWER_DOES_NOT_EXISTS);
            return result;
        }

        const isFollowExists = await this.exists(parameters);

        if (isFollowExists) {
            const result = new Failure<FollowFailure>(FollowFailure.FOLLOW_ALREADY_EXISTS);
            return result;
        }

        // References
        const userCollectionRef = DatabaseAssistant.shared.collection(TxCollections.users);

        const followerUserDocumentRef = userCollectionRef.doc(parameters.followerUserId.valueOf());
        const followingUserDocumentRef = userCollectionRef.doc(parameters.followingUserId.valueOf());

        const followersCollectionRef = followingUserDocumentRef.collection(TxCollections.followers);
        const followingsCollectionRef = followerUserDocumentRef.collection(TxCollections.followings);

        const followerDocumentRef = followersCollectionRef.doc(parameters.followerUserId.valueOf());
        const followingDocumentRef = followingsCollectionRef.doc(parameters.followingUserId.valueOf());

        // Data
        const followerData: Follower = {
            id: parameters.followerUserId,
            creationDate: Dately.shared.now(),
        };

        const followingData: Following = {
            id: parameters.followingUserId,
            creationDate: Dately.shared.now(),
        };

        const followResult = await StreamAssistant.shared.timelineFeed.follow({
            followerUserId: parameters.followerUserId,
            followingUserId: parameters.followingUserId,
        });

        if (followResult instanceof Success) {
            try {
                await DatabaseAssistant.shared.runTransaction(async (transaction) => {
                    const followerUserDocument = await followerUserDocumentRef.get();
                    const followingUserDocument = await followingUserDocumentRef.get();

                    if (followerUserDocument.exists && followingUserDocument.exists) {
                        const follower = followerUserDocument.data() as unknown as User;
                        const following = followingUserDocument.data() as unknown as User;

                        transaction.create(
                            followerDocumentRef,
                            followerData
                        );
                        transaction.create(
                            followingDocumentRef,
                            followingData,
                        );

                        transaction.update(
                            followerUserDocumentRef,
                            {
                                "socialDetails.followingCount": follower.socialDetails.followingCount.valueOf() + 1
                            }
                        );

                        transaction.update(
                            followingUserDocumentRef,
                            {
                                "socialDetails.followersCount": following.socialDetails.followersCount.valueOf() + 1
                            }
                        )

                        return Promise.resolve();
                    } else {
                        return Promise.reject();
                    }
                });

                const result = new Success<Empty>({});
                return result;
            } catch {
                const result = new Failure<FollowFailure>(FollowFailure.UNKNOWN);
                return result;
            }
        }

        const result = new Failure<FollowFailure>(FollowFailure.UNKNOWN);
        return result;
    }

    async unfollow(parameters: {
        followingUserId: String;
        followerUserId: String;
    }): Promise<Success<Empty> | Failure<UnfollowFailure>> {
        const isFollowingUserExists = await UsersManager.shared.exists({
            userId: parameters.followingUserId,
        });
        const isFollowerUserExists = await UsersManager.shared.exists({
            userId: parameters.followerUserId,
        });

        if (!isFollowingUserExists) {
            const result = new Failure<UnfollowFailure>(UnfollowFailure.FOLLOWING_DOES_NOT_EXISTS);
            return result;
        }

        if (!isFollowerUserExists) {
            const result = new Failure<UnfollowFailure>(UnfollowFailure.FOLLOWER_DOES_NOT_EXISTS);
            return result;
        }

        const isFollowExists = await this.exists(parameters);

        if (!isFollowExists) {
            const result = new Failure<UnfollowFailure>(UnfollowFailure.FOLLOW_DOES_NOT_EXISTS);
            return result;
        }

        // References
        const usersCollectionRef = DatabaseAssistant.shared.collection(TxCollections.users);

        const followerUserDocumentRef = usersCollectionRef.doc(parameters.followerUserId.valueOf());
        const followingUserDocumentRef = usersCollectionRef.doc(parameters.followingUserId.valueOf());

        const followersCollectionRef = followingUserDocumentRef.collection(TxCollections.followers);
        const followingsCollectionRef = followerUserDocumentRef.collection(TxCollections.followings);

        const followerDocumentRef = followersCollectionRef.doc(parameters.followerUserId.valueOf());
        const followingDocumentRef = followingsCollectionRef.doc(parameters.followingUserId.valueOf());

        const timelineUnfollowResult = await StreamAssistant.shared.timelineFeed.unfollow({
            followerUserId: parameters.followerUserId,
            followingUserId: parameters.followingUserId,
        });

        if (timelineUnfollowResult instanceof Success) {
            try {
                await DatabaseAssistant.shared.runTransaction(async (transaction) => {
                    const followerUserDocument = await followerUserDocumentRef.get();
                    const followingUserDocument = await followingUserDocumentRef.get();

                    if (followerUserDocument.exists && followingUserDocument.exists) {
                        const follower = followerUserDocument.data() as unknown as User;
                        const following = followingUserDocument.data() as unknown as User;

                        transaction.delete(followerDocumentRef);
                        transaction.delete(followingDocumentRef);

                        transaction.update(
                            followerUserDocumentRef,
                            {
                                "socialDetails.followingCount": Math.max(
                                    follower.socialDetails.followingCount.valueOf() - 1,
                                    0
                                )
                            }
                        );

                        transaction.update(
                            followingUserDocumentRef,
                            {
                                "socialDetails.followersCount": Math.max(
                                    following.socialDetails.followersCount.valueOf() - 1,
                                    0
                                ),
                            }
                        )

                        return Promise.resolve();
                    } else {
                        return Promise.reject();
                    }
                });

                const result = new Success<Empty>({});
                return result;
            } catch {
                const result = new Failure<UnfollowFailure>(UnfollowFailure.UNKNOWN);
                return result;
            }
        }

        const result = new Failure<UnfollowFailure>(UnfollowFailure.UNKNOWN);
        return result;
    }

    async followers(parameters: {
        userId: String;
    } & PaginationQuery): Promise<Success<Paginated<Follower>> | Failure<FollowersFeedFailure>> {
        const isUserExists = await UsersManager.shared.exists({
            userId: parameters.userId
        });

        if (!isUserExists) {
            const result = new Failure<FollowersFeedFailure>(FollowersFeedFailure.USER_DOES_NOT_EXISTS);
            return result;
        }

        // References
        const usersCollectionRef = DatabaseAssistant.shared.collection(TxCollections.users);
        const userDocumentRef = usersCollectionRef.doc(parameters.userId.valueOf());
        const followersCollectionRef = userDocumentRef.collection(TxCollections.followers);

        const limit = Math.min(
            parameters.limit?.valueOf() || 25,
            25
        );

        let query = followersCollectionRef
            .orderBy("creationDate")
            .limit(limit + 1); // +1 to be used for pagination purposes

        if (parameters.nextToken !== undefined) {
            const followerDocumentRef = followersCollectionRef.doc(parameters.nextToken.valueOf());

            query = query.startAfter(followerDocumentRef);
        }

        try {
            const followersQuerySnapshot = await query.get();

            const followers: Follower[] = followersQuerySnapshot.docs.map<Follower>((followerQueryDocument) => {
                const follower = followerQueryDocument.data() as unknown as Follower;
                return follower;
            });

            const feed = new Paginated<Follower>({
                page: followers.slice(0, limit),
                nextToken: followers.length > limit
                    ? followers[followers.length - 1].id
                    : undefined
            });

            const result = new Success<Paginated<Follower>>(feed);
            return result;
        } catch {
            const result = new Failure<FollowersFeedFailure>(FollowersFeedFailure.UNKNOWN);
            return result;
        }
    }

    async followings(parameters: {
        userId: String;
    } & PaginationQuery): Promise<Success<Paginated<Follower>> | Failure<FollowingsFeedFailure>> {
        const isUserExists = await UsersManager.shared.exists({
            userId: parameters.userId
        });

        if (!isUserExists) {
            const result = new Failure<FollowingsFeedFailure>(FollowingsFeedFailure.USER_DOES_NOT_EXISTS);
            return result;
        }

        // References
        const usersCollectionRef = DatabaseAssistant.shared.collection(TxCollections.users);
        const userDocumentRef = usersCollectionRef.doc(parameters.userId.valueOf());
        const followersCollectionRef = userDocumentRef.collection(TxCollections.followings);

        const limit = Math.min(
            parameters.limit?.valueOf() || 25,
            25
        );

        let query = followersCollectionRef
            .orderBy("creationDate")
            .limit(limit + 1); // +1 to be used for pagination purposes

        if (parameters.nextToken !== undefined) {
            const followerDocumentRef = followersCollectionRef.doc(parameters.nextToken.valueOf());

            query = query.startAfter(followerDocumentRef);
        }

        try {
            const followingsQuerySnapshot = await query.get();

            const followings: Follower[] = followingsQuerySnapshot.docs.map<Follower>((followerQueryDocument) => {
                const following = followerQueryDocument.data() as unknown as Follower;
                return following;
            });


            const feed = new Paginated<Follower>({
                page: followings.slice(0, limit),
                nextToken: followings.length > limit
                    ? followings[followings.length - 1].id
                    : undefined,
            });

            const result = new Success<Paginated<Follower>>(feed);
            return result;
        } catch {
            const result = new Failure<FollowingsFeedFailure>(FollowingsFeedFailure.UNKNOWN);
            return result;
        }
    }

    async isFollowing(parameters: {
        followingUserId: String;
        followerUserId: String;
    }): Promise<Boolean> {
        // References
        const usersCollectionRef = DatabaseAssistant.shared.collection(TxCollections.users);
        const followerDocumentRef = usersCollectionRef.doc(parameters.followingUserId.valueOf());
        const followingsCollectionRef = followerDocumentRef.collection(TxCollections.followings);
        const followingDataDocumentRef = followingsCollectionRef.doc(parameters.followingUserId.valueOf());

        // Data
        const document = await followingDataDocumentRef.get();

        if (document.exists) {
            return true;
        } else {
            return false;
        }
    }

    async isFollower(parameters: {
        followingUserId: String;
        followerUserId: String;
    }): Promise<Boolean> {
        // References
        const usersCollectionRef = DatabaseAssistant.shared.collection(TxCollections.users);
        const followingDocumentRef = usersCollectionRef.doc(parameters.followingUserId.valueOf());
        const followersCollectionRef = followingDocumentRef.collection(TxCollections.followers);
        const followerDataDocumentRef = followersCollectionRef.doc(parameters.followerUserId.valueOf());

        // Data
        const document = await followerDataDocumentRef.get();

        if (document.exists) {
            return true;
        } else {
            return false;
        }
    }
}