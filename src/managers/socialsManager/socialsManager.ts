import { DatabaseAssistant, DatabaseCollections } from "../../assistants/database/database";
import { StreamAssistant } from "../../assistants/stream/stream";
import { Dately } from "../../utils/dately/dately";
import { Empty, Failure, Success } from "../../utils/typescriptx/typescriptx";
import { Following, Follower, User } from "../core/models";
import { UsersManager } from "../usersManager/usersManager";
import { FollowFailureReason, UnfollowFailureReason } from "./types";

export class SocialsManager {
    static readonly shared = new SocialsManager();

    private constructor() { }

    async isFollowing(parameters: {
        followingId: String;
        followerId: String;
    }): Promise<Boolean> {
        const followingsCollection = DatabaseAssistant.shared.collection(
            DatabaseCollections.users
            + "/" + parameters.followerId + "/" +
            DatabaseCollections.followings
        );

        const followingDocumentRef = followingsCollection.doc(parameters.followingId.valueOf());

        try {
            const followingDocument = await followingDocumentRef.get();

            if (followingDocument.exists) {
                return true;
            } else {
                return false;
            }
        } catch {
            return false;
        }
    }

    async isFollower(parameters: {
        followingId: String;
        followerId: String;
    }): Promise<Boolean> {
        const followersCollection = DatabaseAssistant.shared.collection(
            DatabaseCollections.users
            + "/" + parameters.followingId + "/" +
            DatabaseCollections.followers
        );

        const followerDocumentRef = followersCollection.doc(parameters.followerId.valueOf());

        try {
            const followerDocument = await followerDocumentRef.get();

            if (followerDocument.exists) {
                return true;
            } else {
                return false;
            }
        } catch {
            return false;
        }
    }

    async follow(parameters: {
        followingId: String;
        followerId: String;
    }): Promise<Success<Empty> | Failure<FollowFailureReason>> {
        const isFolloweeExists = await UsersManager.shared.exists({
            id: parameters.followingId
        });

        if (!isFolloweeExists) {
            const reply = new Failure<FollowFailureReason>(
                FollowFailureReason.followingDoesNotExists
            );

            return reply;
        }

        const isFollowerExists = await UsersManager.shared.exists({
            id: parameters.followerId
        });

        if (!isFollowerExists) {
            const reply = new Failure<FollowFailureReason>(
                FollowFailureReason.followerDoesNotExists
            );

            return reply;
        }


        const followFeed = StreamAssistant.shared.timelineFeed.follow({
            followerUserId: parameters.followerId,
            followingUserId: parameters.followingId
        });

        if (followFeed instanceof Failure) {
            const reply = new Failure<FollowFailureReason>(
                FollowFailureReason.unknown
            );

            return reply;
        } else {
            const followerData: Follower = {
                followerId: parameters.followerId,
                creationDate: Dately.shared.now(),
            };

            const followingData: Following = {
                followingId: parameters.followingId,
                creationDate: Dately.shared.now()
            };

            const usersCollection = DatabaseAssistant.shared.collection(DatabaseCollections.users);

            const followingUserDocumentRef = usersCollection.doc(parameters.followingId.valueOf());
            const followerUserDocumentRef = usersCollection.doc(parameters.followerId.valueOf());

            const followersCollection = followingUserDocumentRef.collection(DatabaseCollections.followers);
            const followingsCollectin = followerUserDocumentRef.collection(DatabaseCollections.followings);

            const followerDataDocumentRef = followersCollection.doc(parameters.followerId.valueOf());
            const followingDataDocumentRef = followingsCollectin.doc(parameters.followingId.valueOf());

            try {
                await DatabaseAssistant.shared.runTransaction(async (transaction) => {
                    const followingUserDocument = await followingUserDocumentRef.get();
                    const followerUserDocument = await followerUserDocumentRef.get();

                    const followingUser = followingUserDocument.data() as unknown as User;
                    const followerUser = followerUserDocument.data() as unknown as User;

                    transaction.create(
                        followingDataDocumentRef,
                        followingData
                    );
                    transaction.create(
                        followerDataDocumentRef,
                        followerData
                    );

                    transaction.update(
                        followerUserDocumentRef,
                        {
                            "socialDetails.followingsCount": followerUser.socialDetails.followingsCount.valueOf() + 1
                        },
                    );

                    transaction.update(
                        followingUserDocumentRef,
                        {
                            "socialDetails.followersCount": followingUser.socialDetails.followersCount.valueOf() + 1
                        },
                    );
                });

                const reply = new Success<Empty>({});

                return reply;
            } catch {
                const reply = new Failure<FollowFailureReason>(
                    FollowFailureReason.unknown
                );

                return reply;
            }
        }
    }


    async unfollow(parameters: {
        followingId: String;
        followerId: String;
    }): Promise<Success<Empty> | Failure<UnfollowFailureReason>> {
        const isFollowing = await this.isFollowing({
            followingId: parameters.followingId,
            followerId: parameters.followerId
        });

        const isFollower = await this.isFollower({
            followingId: parameters.followingId,
            followerId: parameters.followerId
        });

        if (!isFollowing && !isFollower) {
            const reply = new Failure<UnfollowFailureReason>(
                UnfollowFailureReason.relationshipDoesNotExists
            );

            return reply;
        }

        const unfollowFeed = StreamAssistant.shared.timelineFeed.unfollow({
            followerUserId: parameters.followerId,
            followingUserId: parameters.followingId
        });

        if (unfollowFeed instanceof Failure) {
            const reply = new Failure<UnfollowFailureReason>(
                UnfollowFailureReason.unknown
            );

            return reply;
        } else {
            const usersCollection = DatabaseAssistant.shared.collection(DatabaseCollections.users);

            const followingUserDocumentRef = usersCollection.doc(parameters.followingId.valueOf());
            const followerUserDocumentRef = usersCollection.doc(parameters.followerId.valueOf());

            const followersCollection = followingUserDocumentRef.collection(DatabaseCollections.followers);
            const followingsCollectin = followerUserDocumentRef.collection(DatabaseCollections.followings);

            const followerDataDocumentRef = followersCollection.doc(parameters.followerId.valueOf());
            const followingDataDocumentRef = followingsCollectin.doc(parameters.followingId.valueOf());

            try {
                await DatabaseAssistant.shared.runTransaction(async (transaction) => {
                    const followingUserDocument = await followingUserDocumentRef.get();
                    const followerUserDocument = await followerUserDocumentRef.get();

                    const followingUser = followingUserDocument.data() as unknown as User;
                    const followerUser = followerUserDocument.data() as unknown as User;

                    transaction.delete(followingDataDocumentRef);
                    transaction.delete(followerDataDocumentRef);

                    transaction.update(
                        followerUserDocumentRef,
                        {
                            "socialDetails.followingsCount":
                                Math.max(
                                    followerUser.socialDetails.followingsCount.valueOf() - 1,
                                    0
                                )
                        },
                    );

                    transaction.update(
                        followingUserDocumentRef,
                        {
                            "socialDetails.followersCount":
                                Math.max(
                                    followingUser.socialDetails.followersCount.valueOf() - 1,
                                    0
                                )
                        },
                    );
                });

                const reply = new Success<Empty>({});

                return reply;
            } catch {
                const reply = new Failure<UnfollowFailureReason>(
                    UnfollowFailureReason.unknown
                );

                return reply;
            }
        }
    }
}