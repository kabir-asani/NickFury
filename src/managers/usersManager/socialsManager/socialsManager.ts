import { DatabaseAssistant } from "../../../assistants/database/database";
import { StreamAssistant } from "../../../assistants/stream/stream";
import { Empty, Failure, Success } from "../../../utils/typescriptx/typescriptx";
import { TxDatabaseCollections } from "../../core/collections";
import { User } from "../models";
import { Following, Follower } from "./models";
import {
    FollowFailure,
    UnfollowFailure,
} from "./types";

export class SocialsManager {
    public static readonly shared = new SocialsManager();

    async follow(parameters: {
        followingUserId: String;
        followerUserId: String;
    }): Promise<Success<Empty> | Failure<FollowFailure>> {
        // References
        const userCollectionRef = DatabaseAssistant.shared.collection(TxDatabaseCollections.users);

        const followerUserDocumentRef = userCollectionRef.doc(parameters.followerUserId.valueOf());
        const followingUserDocumentRef = userCollectionRef.doc(parameters.followingUserId.valueOf());

        const followersCollectionRef = followingUserDocumentRef.collection(TxDatabaseCollections.followers);
        const followingsCollectionRef = followerUserDocumentRef.collection(TxDatabaseCollections.followings);

        const followerDocumentRef = followersCollectionRef.doc(parameters.followerUserId.valueOf());
        const followingDocumentRef = followingsCollectionRef.doc(parameters.followingUserId.valueOf());

        // Data
        const followerData: Follower = {
            followerId: parameters.followerUserId,
        };

        const followingData: Following = {
            followingId: parameters.followingUserId
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
        // References
        const usersCollectionRef = DatabaseAssistant.shared.collection(TxDatabaseCollections.users);

        const followerUserDocumentRef = usersCollectionRef.doc(parameters.followerUserId.valueOf());
        const followingUserDocumentRef = usersCollectionRef.doc(parameters.followingUserId.valueOf());

        const followersCollectionRef = followingUserDocumentRef.collection(TxDatabaseCollections.followers);
        const followingsCollectionRef = followerUserDocumentRef.collection(TxDatabaseCollections.followings);

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

    async isFollowing(parameters: {
        followingUserId: String;
        followerUserId: String;
    }): Promise<Boolean> {
        // References
        const usersCollectionRef = DatabaseAssistant.shared.collection(TxDatabaseCollections.users);
        const followerDocumentRef = usersCollectionRef.doc(parameters.followingUserId.valueOf());
        const followingsCollectionRef = followerDocumentRef.collection(TxDatabaseCollections.followings);
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
        const usersCollectionRef = DatabaseAssistant.shared.collection(TxDatabaseCollections.users);
        const followingDocumentRef = usersCollectionRef.doc(parameters.followingUserId.valueOf());
        const followersCollectionRef = followingDocumentRef.collection(TxDatabaseCollections.followers);
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