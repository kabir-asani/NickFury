import { DatabaseAssistant } from "../../assistants/database/database";
import { TxDatabaseCollections } from "../core/collections";
import { Samaritan } from "../samaritansManager/models";
import { FolloweeData, FollowerData } from "./models";
import {
    SocialsFollowFailure,
    SocialsFollowSuccess,
    SocialsUnfollowFailure,
    SocialsUnfollowSuccess,
    UnknownSocialsFollowFailure,
    UnknownSocialsUnfollowFailure
} from "./types";

export class SocialsManager {
    private static _shared = new SocialsManager();
    public static shared = (): SocialsManager => this._shared;

    async follow(parameters: {
        followeeSid: String,
        followerSid: String,
    }): Promise<SocialsFollowSuccess | SocialsFollowFailure> {
        // References
        const samaritansCollectionRef = DatabaseAssistant.shared.collection(TxDatabaseCollections.samaritans);
        const followerDocumentRef = samaritansCollectionRef.doc(parameters.followeeSid.valueOf());
        const followeeDocumentRef = samaritansCollectionRef.doc(parameters.followeeSid.valueOf());

        const followersCollectionRef = followeeDocumentRef.collection(TxDatabaseCollections.followers);
        const followeesCollectionRef = followerDocumentRef.collection(TxDatabaseCollections.followings);

        const followerDataDocumentRef = followersCollectionRef.doc(parameters.followerSid.valueOf());
        const followeeDataDocumentRef = followeesCollectionRef.doc(parameters.followeeSid.valueOf());

        // Data
        const followerData: FollowerData = {
            follower: parameters.followerSid,
        };

        const followeeData: FolloweeData = {
            followee: parameters.followeeSid
        };

        try {
            await DatabaseAssistant.shared.runTransaction(async (transaction) => {
                const followerDocument = await followerDocumentRef.get();
                const followeeDocument = await followeeDocumentRef.get();

                if (followerDocument.exists && followeeDocument.exists) {
                    const follower = followerDocument.data() as unknown as Samaritan;
                    const followee = followeeDocument.data() as unknown as Samaritan;

                    transaction.create(
                        followerDataDocumentRef,
                        followerData
                    );
                    transaction.create(
                        followeeDataDocumentRef,
                        followeeData,
                    );

                    transaction.update(
                        followerDocumentRef,
                        {
                            "socialDetails.followingCount": follower.socialDetails.followingCount.valueOf() + 1
                        }
                    );

                    transaction.update(
                        followeeDocumentRef,
                        {
                            "socialDetails.followersCount": followee.socialDetails.followersCount.valueOf() + 1
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
        followeeSid: String,
        followerSid: String,
    }): Promise<SocialsUnfollowSuccess | SocialsUnfollowFailure> {
        // References
        const samaritansCollectionRef = DatabaseAssistant.shared.collection(TxDatabaseCollections.samaritans);
        const followerDocumentRef = samaritansCollectionRef.doc(parameters.followeeSid.valueOf());
        const followeeDocumentRef = samaritansCollectionRef.doc(parameters.followeeSid.valueOf());

        const followersCollectionRef = followeeDocumentRef.collection(TxDatabaseCollections.followers);
        const followeesCollectionRef = followerDocumentRef.collection(TxDatabaseCollections.followings);

        const followerDataDocumentRef = followersCollectionRef.doc(parameters.followerSid.valueOf());
        const followeeDataDocumentRef = followeesCollectionRef.doc(parameters.followeeSid.valueOf());

        try {
            await DatabaseAssistant.shared.runTransaction(async (transaction) => {
                const followerDocument = await followerDocumentRef.get();
                const followeeDocument = await followeeDocumentRef.get();

                if (followerDocument.exists && followeeDocument.exists) {
                    const follower = followerDocument.data() as unknown as Samaritan;
                    const followee = followeeDocument.data() as unknown as Samaritan;

                    transaction.delete(followerDataDocumentRef);
                    transaction.delete(followeeDataDocumentRef);

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
                        followeeDocumentRef,
                        {
                            "socialDetails.followersCount": Math.max(
                                followee.socialDetails.followersCount.valueOf() - 1,
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
}