import {
    DatabaseAssistant,
    DBCollections,
} from "../../assistants/database/database";
import StreamAssistant from "../../assistants/stream/stream";
import Dately from "../../utils/dately/dately";
import logger, { LogLevel } from "../../utils/logger/logger";
import { Empty, Failure, Success } from "../../utils/typescriptx/typescriptx";
import {
    Following,
    Follower,
    User,
    ViewableFollower,
    ViewableFollowing,
    FollowerViewables,
    FollowingViewables,
} from "../core/models";
import {
    kMaximumPaginatedPageLength,
    Paginated,
    PaginationParameters,
    Value,
    ViewablesParameters,
} from "../core/types";
import UsersManager from "../usersManager/usersManager";
import {
    FollowFailureReason,
    UnfollowFailureReason,
    PaginatedViewableFollowersFailureReason,
    PaginatedViewableFollowingsFailureReason,
    PaginatedFollowersFailureReason,
    PaginatedFollowingsFailureReason,
} from "./types";

export default class SocialsManager {
    static readonly shared = new SocialsManager();

    private constructor() {}

    async isFollowingRelationshipExists(parameters: {
        followingId: String;
        followerId: String;
    }): Promise<Boolean> {
        const followingDocumentPath =
            DBCollections.users +
            `/${parameters.followerId}/` +
            `/${DBCollections.followings}/` +
            parameters.followingId;

        const followingDocumentRef = DatabaseAssistant.shared.doc(
            followingDocumentPath
        );

        const followingDocument = await followingDocumentRef.get();

        if (followingDocument.exists) {
            return true;
        }

        return false;
    }

    async isFollowerRelationshipExists(parameters: {
        followingId: String;
        followerId: String;
    }): Promise<Boolean> {
        const followerDocumentPath =
            DBCollections.users +
            `/${parameters.followingId}/` +
            `/${DBCollections.followers}/` +
            parameters.followerId;

        const followerDocumentRef =
            DatabaseAssistant.shared.doc(followerDocumentPath);

        const followerDocument = await followerDocumentRef.get();

        if (followerDocument.exists) {
            return true;
        }

        return false;
    }

    async followerRelationshipStatuses(parameters: {
        followingIdentifiers: String[];
        followerId: String;
    }): Promise<Value<Boolean>> {
        if (parameters.followingIdentifiers.length === 0) {
            return {};
        }

        const followingDocumentRefs = parameters.followingIdentifiers.map(
            (followingId) => {
                const followingDocumentPath =
                    DBCollections.users +
                    `/${parameters.followerId}/` +
                    DBCollections.followings +
                    `/${followingId}`;

                const followingDocumentRef = DatabaseAssistant.shared.doc(
                    followingDocumentPath
                );

                return followingDocumentRef;
            }
        );

        const followingDocuments = await DatabaseAssistant.shared.getAll(
            ...followingDocumentRefs
        );

        const followerRelationshipStatuses: Value<Boolean> = {};

        followingDocuments.forEach((followingDocument) => {
            followerRelationshipStatuses[followingDocument.id] =
                followingDocument.exists;
        });

        return followerRelationshipStatuses;
    }

    async followingRelationshipStatuses(parameters: {
        followerIdentifiers: String[];
        followingId: String;
    }): Promise<Value<Boolean>> {
        if (parameters.followerIdentifiers.length === 0) {
            return {};
        }

        const followerDocumentRefs = parameters.followerIdentifiers.map(
            (followerId) => {
                const followerDocumentPath =
                    DBCollections.users +
                    `/${parameters.followingId}/` +
                    DBCollections.followers +
                    `/${followerId}`;

                const followerDocumentRef =
                    DatabaseAssistant.shared.doc(followerDocumentPath);

                return followerDocumentRef;
            }
        );

        const followerDocuments = await DatabaseAssistant.shared.getAll(
            ...followerDocumentRefs
        );

        const followingRelationshipStatuses: Value<Boolean> = {};

        followerDocuments.forEach((followerDocument) => {
            followingRelationshipStatuses[followerDocument.id] =
                followerDocument.exists;
        });

        return followingRelationshipStatuses;
    }

    async follow(parameters: {
        followingId: String;
        followerId: String;
    }): Promise<Success<Empty> | Failure<FollowFailureReason>> {
        const isFollowingExists = await UsersManager.shared.exists({
            id: parameters.followingId,
        });

        if (!isFollowingExists) {
            const reply = new Failure<FollowFailureReason>(
                FollowFailureReason.followingDoesNotExists
            );

            return reply;
        }

        const isFollowerExists = await UsersManager.shared.exists({
            id: parameters.followerId,
        });

        if (!isFollowerExists) {
            const reply = new Failure<FollowFailureReason>(
                FollowFailureReason.followerDoesNotExists
            );

            return reply;
        }

        const followFeed = StreamAssistant.shared.timelineFeed.follow({
            followerUserId: parameters.followerId,
            followingUserId: parameters.followingId,
        });

        if (followFeed instanceof Failure) {
            const reply = new Failure<FollowFailureReason>(
                FollowFailureReason.unknown
            );

            return reply;
        }

        const followerData: Follower = {
            followerId: parameters.followerId,
            creationDate: Dately.shared.now(),
        };

        const followingData: Following = {
            followingId: parameters.followingId,
            creationDate: Dately.shared.now(),
        };

        const usersCollection = DatabaseAssistant.shared.collection(
            DBCollections.users
        );

        const followingUserDocumentRef = usersCollection.doc(
            parameters.followingId.valueOf()
        );
        const followerUserDocumentRef = usersCollection.doc(
            parameters.followerId.valueOf()
        );

        const followersCollection = followingUserDocumentRef.collection(
            DBCollections.followers
        );
        const followingsCollectin = followerUserDocumentRef.collection(
            DBCollections.followings
        );

        const followerDataDocumentRef = followersCollection.doc(
            parameters.followerId.valueOf()
        );
        const followingDataDocumentRef = followingsCollectin.doc(
            parameters.followingId.valueOf()
        );

        try {
            await DatabaseAssistant.shared.runTransaction(
                async (transaction) => {
                    const followingUserDocument =
                        await followingUserDocumentRef.get();
                    const followerUserDocument =
                        await followerUserDocumentRef.get();

                    const followingUser =
                        followingUserDocument.data() as unknown as User;
                    const followerUser =
                        followerUserDocument.data() as unknown as User;

                    transaction.set(followingDataDocumentRef, followingData);
                    transaction.set(followerDataDocumentRef, followerData);

                    transaction.update(followerUserDocumentRef, {
                        "socialDetails.followingsCount":
                            followerUser.socialDetails.followingsCount.valueOf() +
                            1,
                    });

                    transaction.update(followingUserDocumentRef, {
                        "socialDetails.followersCount":
                            followingUser.socialDetails.followersCount.valueOf() +
                            1,
                    });
                }
            );

            const reply = new Success<Empty>({});

            return reply;
        } catch (e) {
            logger(e, LogLevel.attention, [this, this.follow]);

            const reply = new Failure<FollowFailureReason>(
                FollowFailureReason.unknown
            );

            return reply;
        }
    }

    async unfollow(parameters: {
        followingId: String;
        followerId: String;
    }): Promise<Success<Empty> | Failure<UnfollowFailureReason>> {
        const isFollowing = await this.isFollowingRelationshipExists({
            followingId: parameters.followingId,
            followerId: parameters.followerId,
        });

        const isFollower = await this.isFollowerRelationshipExists({
            followingId: parameters.followingId,
            followerId: parameters.followerId,
        });

        if (!isFollowing && !isFollower) {
            const reply = new Failure<UnfollowFailureReason>(
                UnfollowFailureReason.relationshipDoesNotExists
            );

            return reply;
        }

        const unfollowFeed = StreamAssistant.shared.timelineFeed.unfollow({
            followerUserId: parameters.followerId,
            followingUserId: parameters.followingId,
        });

        if (unfollowFeed instanceof Failure) {
            const reply = new Failure<UnfollowFailureReason>(
                UnfollowFailureReason.unknown
            );

            return reply;
        }

        const usersCollection = DatabaseAssistant.shared.collection(
            DBCollections.users
        );

        const followingUserDocumentRef = usersCollection.doc(
            parameters.followingId.valueOf()
        );
        const followerUserDocumentRef = usersCollection.doc(
            parameters.followerId.valueOf()
        );

        const followersCollection = followingUserDocumentRef.collection(
            DBCollections.followers
        );
        const followingsCollectin = followerUserDocumentRef.collection(
            DBCollections.followings
        );

        const followerDataDocumentRef = followersCollection.doc(
            parameters.followerId.valueOf()
        );
        const followingDataDocumentRef = followingsCollectin.doc(
            parameters.followingId.valueOf()
        );

        try {
            await DatabaseAssistant.shared.runTransaction(
                async (transaction) => {
                    const followingUserDocument =
                        await followingUserDocumentRef.get();
                    const followerUserDocument =
                        await followerUserDocumentRef.get();

                    const followingUser =
                        followingUserDocument.data() as unknown as User;
                    const followerUser =
                        followerUserDocument.data() as unknown as User;

                    transaction.delete(followingDataDocumentRef);
                    transaction.delete(followerDataDocumentRef);

                    transaction.update(followerUserDocumentRef, {
                        "socialDetails.followingsCount": Math.max(
                            followerUser.socialDetails.followingsCount.valueOf() -
                                1,
                            0
                        ),
                    });

                    transaction.update(followingUserDocumentRef, {
                        "socialDetails.followersCount": Math.max(
                            followingUser.socialDetails.followersCount.valueOf() -
                                1,
                            0
                        ),
                    });
                }
            );

            const reply = new Success<Empty>({});

            return reply;
        } catch (e) {
            logger(e, LogLevel.attention, [this, this.unfollow]);

            const reply = new Failure<UnfollowFailureReason>(
                UnfollowFailureReason.unknown
            );

            return reply;
        }
    }

    private async paginatedFollowers(
        parameters: {
            userId: String;
        } & PaginationParameters
    ): Promise<
        Success<Paginated<Follower>> | Failure<PaginatedFollowersFailureReason>
    > {
        const followersCollectionPath =
            DBCollections.users +
            `/${parameters.userId}/` +
            DBCollections.followers;

        const followingsCollection = DatabaseAssistant.shared.collection(
            followersCollectionPath
        );

        const limit =
            parameters.limit?.valueOf() || kMaximumPaginatedPageLength;

        let query = followingsCollection
            .orderBy("creationDate")
            .limit(limit + 1);

        if (parameters.nextToken !== undefined) {
            query = query.startAt(parameters.nextToken);
        }

        try {
            const querySnapshot = await query.get();

            if (querySnapshot.empty) {
                const paginatedFollowers: Paginated<Follower> = {
                    page: [],
                };

                const reply = new Success<Paginated<Follower>>(
                    paginatedFollowers
                );

                return reply;
            }

            let nextToken = undefined;

            if (querySnapshot.docs.length === limit + 1) {
                const lastDocument = querySnapshot.docs.pop();

                if (lastDocument !== undefined) {
                    nextToken = (lastDocument.data() as unknown as Follower)
                        .creationDate;
                }
            }

            const followers = querySnapshot.docs.map((queryDocument) => {
                const follower = queryDocument.data() as unknown as Follower;

                return follower;
            });

            const paginatedFollowers: Paginated<Follower> = {
                page: followers,
                nextToken: nextToken,
            };

            const reply = new Success<Paginated<Follower>>(paginatedFollowers);

            return reply;
        } catch (e) {
            logger(e, LogLevel.attention, [this, this.paginatedFollowers]);

            const reply = new Failure<PaginatedFollowersFailureReason>(
                PaginatedFollowersFailureReason.unknown
            );

            return reply;
        }
    }

    async paginatedViewableFollowers(
        parameters: {
            userId: String;
        } & ViewablesParameters &
            PaginationParameters
    ): Promise<
        | Success<Paginated<ViewableFollower>>
        | Failure<PaginatedViewableFollowersFailureReason>
    > {
        const followersResult = await this.paginatedFollowers({
            userId: parameters.userId,
            limit: parameters.limit,
            nextToken: parameters.nextToken,
        });

        if (followersResult instanceof Failure) {
            const reply = new Failure<PaginatedViewableFollowersFailureReason>(
                PaginatedViewableFollowersFailureReason.unknown
            );

            return reply;
        }

        const followers = followersResult.data;

        if (followers.page.length === 0) {
            const paginatedFollowers: Paginated<ViewableFollower> = {
                page: [],
            };

            const reply = new Success<Paginated<ViewableFollower>>(
                paginatedFollowers
            );

            return reply;
        }

        const viewableUsersResult = await UsersManager.shared.viewableUsers({
            userIdentifiers: followers.page.map(
                (followerData) => followerData.followerId
            ),
            viewerId: parameters.viewerId,
        });

        if (viewableUsersResult instanceof Failure) {
            const reply = new Failure<PaginatedViewableFollowersFailureReason>(
                PaginatedViewableFollowersFailureReason.unknown
            );

            return reply;
        }

        const viewableUsers = viewableUsersResult.data;

        const viewableFollowersData = followers.page.map((followerData) => {
            const followerViewables: FollowerViewables = {
                follower: viewableUsers[followerData.followerId.valueOf()],
            };

            const viewableFollower: ViewableFollower = {
                ...followerData,
                viewables: followerViewables,
            };

            return viewableFollower;
        });

        const paginatedFollowers: Paginated<ViewableFollower> = {
            page: viewableFollowersData,
            nextToken: followers.nextToken,
        };

        const reply = new Success<Paginated<ViewableFollower>>(
            paginatedFollowers
        );

        return reply;
    }

    private async paginatedFollowings(
        parameters: {
            userId: String;
        } & PaginationParameters
    ): Promise<
        | Success<Paginated<Following>>
        | Failure<PaginatedFollowingsFailureReason>
    > {
        const followingsCollectionPath =
            DBCollections.users +
            `/${parameters.userId}/` +
            DBCollections.followings;

        const followingsCollection = DatabaseAssistant.shared.collection(
            followingsCollectionPath
        );

        const limit =
            parameters.limit?.valueOf() || kMaximumPaginatedPageLength;

        let query = followingsCollection
            .orderBy("creationDate")
            .limit(limit + 1);

        if (parameters.nextToken !== undefined) {
            query = query.startAt(parameters.nextToken);
        }

        try {
            const querySnapshot = await query.get();

            if (querySnapshot.empty) {
                const paginatedFollowings: Paginated<Following> = {
                    page: [],
                };

                const reply = new Success<Paginated<Following>>(
                    paginatedFollowings
                );

                return reply;
            }

            let nextToken = undefined;

            if (querySnapshot.docs.length === limit + 1) {
                const lastDocument = querySnapshot.docs.pop();

                if (lastDocument !== undefined) {
                    nextToken = (lastDocument.data() as unknown as Following)
                        .creationDate;
                }
            }

            const followings = querySnapshot.docs.map((queryDocument) => {
                const following = queryDocument.data() as unknown as Following;

                return following;
            });

            const paginatedFollowings: Paginated<Following> = {
                page: followings,
                nextToken: nextToken,
            };

            const reply = new Success<Paginated<Following>>(
                paginatedFollowings
            );

            return reply;
        } catch (e) {
            logger(e, LogLevel.attention, [this, this.paginatedFollowings]);

            const reply = new Failure<PaginatedFollowingsFailureReason>(
                PaginatedFollowingsFailureReason.unknown
            );

            return reply;
        }
    }

    async paginatedViewableFollowings(
        parameters: {
            userId: String;
        } & ViewablesParameters &
            PaginationParameters
    ): Promise<
        | Success<Paginated<ViewableFollowing>>
        | Failure<PaginatedViewableFollowingsFailureReason>
    > {
        const limit =
            parameters.limit?.valueOf() || kMaximumPaginatedPageLength;

        const followingsResult = await this.paginatedFollowings({
            userId: parameters.userId,
            limit: limit,
            nextToken: parameters.nextToken,
        });

        if (followingsResult instanceof Failure) {
            const reply = new Failure<PaginatedViewableFollowingsFailureReason>(
                PaginatedViewableFollowingsFailureReason.unknown
            );

            return reply;
        }

        const followings = followingsResult.data;

        if (followings.page.length === 0) {
            const paginatedFollowings: Paginated<ViewableFollowing> = {
                page: [],
            };

            const reply = new Success<Paginated<ViewableFollowing>>(
                paginatedFollowings
            );

            return reply;
        }

        const viewableUsersResult = await UsersManager.shared.viewableUsers({
            userIdentifiers: followings.page.map(
                (followerData) => followerData.followingId
            ),
            viewerId: parameters.viewerId,
        });

        if (viewableUsersResult instanceof Failure) {
            const reply = new Failure<PaginatedViewableFollowingsFailureReason>(
                PaginatedViewableFollowingsFailureReason.unknown
            );

            return reply;
        }

        const viewableUsers = viewableUsersResult.data;

        const viewableFollowingsData = followings.page.map((followerData) => {
            const followingViewables: FollowingViewables = {
                following: viewableUsers[followerData.followingId.valueOf()],
            };

            const viewableFollowing: ViewableFollowing = {
                ...followerData,
                viewables: followingViewables,
            };

            return viewableFollowing;
        });

        const paginatedFollowings: Paginated<ViewableFollowing> = {
            page: viewableFollowingsData,
            nextToken: followings.nextToken,
        };

        const reply = new Success<Paginated<ViewableFollowing>>(
            paginatedFollowings
        );

        return reply;
    }
}
