import { DatabaseAssistant } from "../../../assistants/database/database";
import { TxDatabaseCollections } from "../../core/collections";
import { Samaritan } from "../models";
import { Following, Follower } from "./models";
import {
    SocialsFollowFailure,
    SocialsFollowSuccess,
    SocialsUnfollowFailure,
    SocialsUnfollowSuccess,
    UnknownSocialsFollowFailure,
    UnknownSocialsUnfollowFailure
} from "./types";

export class SocialsManager {
    public static readonly shared = new SocialsManager();

    async follow(parameters: {
        followingSid: String,
        followerSid: String,
    }): Promise<SocialsFollowSuccess | SocialsFollowFailure> {
        // References
        const samaritansCollectionRef = DatabaseAssistant.shared.collection(TxDatabaseCollections.samaritans);
        const followerDocumentRef = samaritansCollectionRef.doc(parameters.followerSid.valueOf());
        const followingDocumentRef = samaritansCollectionRef.doc(parameters.followingSid.valueOf());

        const followersCollectionRef = followingDocumentRef.collection(TxDatabaseCollections.followers);
        const followingsCollectionRef = followerDocumentRef.collection(TxDatabaseCollections.followings);

        const followerDataDocumentRef = followersCollectionRef.doc(parameters.followerSid.valueOf());
        const followingDataDocumentRef = followingsCollectionRef.doc(parameters.followingSid.valueOf());

        // Storage pattern is as follows:--
        // FollowerDocument -> followingsCollection
        // followingDocument -> FollowersCollection
        // Follower needs to keep track of who she is following
        // following needs to keep track of who is following her

        // Data
        const followerData: Follower = {
            followerId: parameters.followerSid,
        };

        const followingData: Following = {
            followingId: parameters.followingSid
        };

        try {
            await DatabaseAssistant.shared.runTransaction(async (transaction) => {
                const followerDocument = await followerDocumentRef.get();
                const followingDocument = await followingDocumentRef.get();

                if (followerDocument.exists && followingDocument.exists) {
                    const follower = followerDocument.data() as unknown as Samaritan;
                    const following = followingDocument.data() as unknown as Samaritan;

                    transaction.create(
                        followerDataDocumentRef,
                        followerData
                    );
                    transaction.create(
                        followingDataDocumentRef,
                        followingData,
                    );

                    transaction.update(
                        followerDocumentRef,
                        {
                            "socialDetails.followingCount": follower.socialDetails.followingCount.valueOf() + 1
                        }
                    );

                    transaction.update(
                        followingDocumentRef,
                        {
                            "socialDetails.followersCount": following.socialDetails.followersCount.valueOf() + 1
                        }
                    )

                    return Promise.resolve();
                } else {
                    return Promise.reject();
                }
            });

            const result = new SocialsFollowSuccess();
            return result;
        } catch {
            const result = new UnknownSocialsFollowFailure();
            return result;
        }
    }

    async unfollow(parameters: {
        followingSid: String,
        followerSid: String,
    }): Promise<SocialsUnfollowSuccess | SocialsUnfollowFailure> {
        // References
        const samaritansCollectionRef = DatabaseAssistant.shared.collection(TxDatabaseCollections.samaritans);
        const followerDocumentRef = samaritansCollectionRef.doc(parameters.followerSid.valueOf());
        const followingDocumentRef = samaritansCollectionRef.doc(parameters.followingSid.valueOf());

        const followersCollectionRef = followingDocumentRef.collection(TxDatabaseCollections.followers);
        const followingsCollectionRef = followerDocumentRef.collection(TxDatabaseCollections.followings);

        const followerDataDocumentRef = followersCollectionRef.doc(parameters.followerSid.valueOf());
        const followingDataDocumentRef = followingsCollectionRef.doc(parameters.followingSid.valueOf());

        try {
            await DatabaseAssistant.shared.runTransaction(async (transaction) => {
                const followerDocument = await followerDocumentRef.get();
                const followingDocument = await followingDocumentRef.get();

                if (followerDocument.exists && followingDocument.exists) {
                    const follower = followerDocument.data() as unknown as Samaritan;
                    const following = followingDocument.data() as unknown as Samaritan;

                    transaction.delete(followerDataDocumentRef);
                    transaction.delete(followingDataDocumentRef);

                    transaction.update(
                        followerDocumentRef,
                        {
                            "socialDetails.followingCount": Math.max(
                                follower.socialDetails.followingCount.valueOf() - 1,
                                0
                            )
                        }
                    );

                    transaction.update(
                        followingDocumentRef,
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

            const result = new SocialsUnfollowSuccess();
            return result;
        } catch {
            const result = new UnknownSocialsUnfollowFailure();
            return result;
        }
    }

    async isFollowing(parameters: {
        followingSid: String,
        followerSid: String, 
    }): Promise<Boolean> {
        // References
        const samaritansCollectionRef = DatabaseAssistant.shared.collection(TxDatabaseCollections.samaritans);
        const followerDocumentRef = samaritansCollectionRef.doc(parameters.followingSid.valueOf());
        const followingsCollectionRef = followerDocumentRef.collection(TxDatabaseCollections.followings);
        const followingDataDocumentRef = followingsCollectionRef.doc(parameters.followingSid.valueOf());

        const document = await followingDataDocumentRef.get();

        if (document.exists) {
            return true;
        } else {
            return false;
        }
    }

    async isFollower(parameters: {
        followingSid: String,
        followerSid: String,
    }): Promise<Boolean> {
        // References
        const samaritansCollectionRef = DatabaseAssistant.shared.collection(TxDatabaseCollections.samaritans);
        const followingDocumentRef = samaritansCollectionRef.doc(parameters.followingSid.valueOf());
        const followersCollectionRef = followingDocumentRef.collection(TxDatabaseCollections.followers);
        const followerDataDocumentRef = followersCollectionRef.doc(parameters.followerSid.valueOf());

        const document = await followerDataDocumentRef.get();

        if (document.exists) {
            return true;
        } else {
            return false;
        }
    }
}