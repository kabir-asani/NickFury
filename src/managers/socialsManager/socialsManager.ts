import { DatabaseAssistant, DatabaseCollections } from "../../assistants/database/database";
import { StreamAssistant } from "../../assistants/stream/stream";
import { Dately } from "../../utils/dately/dately";
import { Empty, Failure, Success } from "../../utils/typescriptx/typescriptx";
import { Following, Follower, User, ViewableFollower, ViewableFollowing, FollowerViewables, FollowingViewables } from "../core/models";
import { kMaximumPaginatedPageLength, Paginated, PaginationParameters, ViewablesParameters2 } from "../core/types";
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


    async followingStatuses(parameters: {
        followerId: String;
        followingIds: String[]
    }): Promise<{ [key: string]: Boolean }> {
        const usersCollection = DatabaseAssistant.shared.collection(DatabaseCollections.users);
        const followerDocumentRef = usersCollection.doc(parameters.followerId.valueOf());

        const followingDocumentRefs = parameters.followingIds.map((followingId) => {
            const followingsCollection = followerDocumentRef.collection(DatabaseCollections.followings);
            const followingDocumentRef = followingsCollection.doc(followingId.valueOf());

            return followingDocumentRef;
        });

        const followingDocuments = await DatabaseAssistant.shared.getAll(...followingDocumentRefs);

        const followingStatuses: { [key: string]: Boolean } = {};


        for (let followingDocument of followingDocuments) {
            followingStatuses[followingDocument.id] = followingDocument.exists;
        }

        return followingStatuses;
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

                    transaction.set(
                        followingDataDocumentRef,
                        followingData
                    );
                    transaction.set(
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

    async followers(parameters: {
        userId: String;
    } & PaginationParameters): Promise<Paginated<Follower> | null> {
        const followingsCollection = DatabaseAssistant.shared.collection(
            DatabaseCollections.users
            + "/" + parameters.userId + "/" +
            DatabaseCollections.followers
        );

        const limit = parameters.limit?.valueOf() || kMaximumPaginatedPageLength;

        let query = followingsCollection
            .orderBy("creationDate")
            .limit(limit + 1);

        if (parameters.nextToken !== undefined) {
            query = query.startAt(parameters.nextToken);
        }

        try {
            const querySnapshot = await query.get();

            if (querySnapshot.empty) {
                const reply: Paginated<Follower> = {
                    page: []
                };

                return reply;
            } else {
                let nextToken = undefined;

                if (querySnapshot.docs.length === limit + 1) {
                    const lastDocument = querySnapshot.docs.pop();

                    if (lastDocument !== undefined) {
                        nextToken = (lastDocument.data() as unknown as Follower).creationDate;
                    }
                }

                const followers = querySnapshot.docs.map((queryDocument) => {
                    const follower = queryDocument.data() as unknown as Follower;

                    return follower;
                });

                const reply: Paginated<Follower> = {
                    page: followers,
                    nextToken: nextToken
                };

                return reply;
            }
        } catch {
            return null;
        }
    }

    async viewableFollowers(parameters: {
        userId: String;
    } & ViewablesParameters2 & PaginationParameters): Promise<Paginated<ViewableFollower> | null> {
        const followersCollection = DatabaseAssistant.shared.collection(
            DatabaseCollections.users
            + "/" + parameters.userId + "/" +
            DatabaseCollections.followers
        );

        const limit = parameters.limit?.valueOf() || kMaximumPaginatedPageLength;

        let query = followersCollection
            .orderBy("creationDate")
            .limit(limit + 1);

        if (parameters.nextToken !== undefined) {
            query = query.startAt(parameters.nextToken);
        }

        try {
            const querySnapshot = await query.get();

            if (querySnapshot.empty) {
                const reply: Paginated<ViewableFollower> = {
                    page: []
                };

                return reply;
            } else {
                let nextToken = undefined;

                if (querySnapshot.docs.length === limit + 1) {
                    const lastDocument = querySnapshot.docs.pop();

                    if (lastDocument !== undefined) {
                        nextToken = (lastDocument.data() as unknown as Follower).creationDate;
                    }
                }

                const followersData = querySnapshot.docs.map((queryDocument) => {
                    const followerData = queryDocument.data() as unknown as Follower;

                    return followerData;
                });

                const viewableUsers = await UsersManager.shared.viewableUsers({
                    ids: followersData.map((followerData) => followerData.followerId),
                    viewerId: parameters.viewerId
                });

                if (viewableUsers === null) {
                    return null;
                }

                const viewableFollowersData = followersData.map((followerData) => {
                    const followerViewables: FollowerViewables = {
                        follower: viewableUsers[followerData.followerId.valueOf()]
                    };

                    const viewableFollower: ViewableFollower = {
                        ...followerData,
                        viewables: followerViewables
                    };

                    return viewableFollower;
                })

                const reply: Paginated<ViewableFollower> = {
                    page: viewableFollowersData,
                    nextToken: nextToken
                };

                return reply;
            }
        } catch {
            return null;
        }
    }

    async followings(parameters: {
        userId: String;
    } & PaginationParameters): Promise<Paginated<Following> | null> {
        const followingsCollection = DatabaseAssistant.shared.collection(
            DatabaseCollections.users
            + "/" + parameters.userId + "/" +
            DatabaseCollections.followings
        );

        const limit = parameters.limit?.valueOf() || kMaximumPaginatedPageLength;

        let query = followingsCollection
            .orderBy("creationDate")
            .limit(limit + 1);

        if (parameters.nextToken !== undefined) {
            query = query.startAt(parameters.nextToken);
        }

        try {
            const querySnapshot = await query.get();

            if (querySnapshot.empty) {
                const reply: Paginated<Following> = {
                    page: []
                };

                return reply;
            } else {
                let nextToken = undefined;

                if (querySnapshot.docs.length === limit + 1) {
                    const lastDocument = querySnapshot.docs.pop();

                    if (lastDocument !== undefined) {
                        nextToken = (lastDocument.data() as unknown as Following).creationDate;
                    }
                }

                const followings = querySnapshot.docs.map((queryDocument) => {
                    const following = queryDocument.data() as unknown as Following;

                    return following;
                });

                const reply: Paginated<Following> = {
                    page: followings,
                    nextToken: nextToken
                };

                return reply;
            }
        } catch {
            return null;
        }
    }


    async viewableFollowings(parameters: {
        userId: String;
    } & ViewablesParameters2 & PaginationParameters): Promise<Paginated<ViewableFollowing> | null> {
        const followingssCollection = DatabaseAssistant.shared.collection(
            DatabaseCollections.users
            + "/" + parameters.userId + "/" +
            DatabaseCollections.followings
        );

        const limit = parameters.limit?.valueOf() || kMaximumPaginatedPageLength;

        let query = followingssCollection
            .orderBy("creationDate")
            .limit(limit + 1);

        if (parameters.nextToken !== undefined) {
            query = query.startAt(parameters.nextToken);
        }

        try {
            const querySnapshot = await query.get();

            if (querySnapshot.empty) {
                const reply: Paginated<ViewableFollowing> = {
                    page: []
                };

                return reply;
            } else {
                let nextToken = undefined;

                if (querySnapshot.docs.length === limit + 1) {
                    const lastDocument = querySnapshot.docs.pop();

                    if (lastDocument !== undefined) {
                        nextToken = (lastDocument.data() as unknown as Following).creationDate;
                    }
                }

                const followingsData = querySnapshot.docs.map((queryDocument) => {
                    const followerData = queryDocument.data() as unknown as Following;

                    return followerData;
                });

                const viewableUsers = await UsersManager.shared.viewableUsers({
                    ids: followingsData.map((followerData) => followerData.followingId),
                    viewerId: parameters.viewerId
                });


                if (viewableUsers === null) {
                    return null;
                }

                const viewableFollowingsData = followingsData.map((followerData) => {
                    const followingViewables: FollowingViewables = {
                        following: viewableUsers[followerData.followingId.valueOf()]
                    };

                    const viewableFollowing: ViewableFollowing = {
                        ...followerData,
                        viewables: followingViewables
                    };

                    return viewableFollowing;
                })

                const reply: Paginated<ViewableFollowing> = {
                    page: viewableFollowingsData,
                    nextToken: nextToken
                };

                return reply;
            }
        } catch {
            return null;
        }
    }
}