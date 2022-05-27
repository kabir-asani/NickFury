import DatabaseAssistant from "../../assistants/database/database";
import StreamAssistant from "../../assistants/stream/stream";
import Dately from "../../utils/dately/dately";
import logger, { LogLevel } from "../../utils/logger/logger";
import { Empty, Failure, Success } from "../../utils/typescriptx/typescriptx";
import {
    Following,
    Follower,
    User,
    ViewableFollower,
    ViewableFollowee,
    FollowerViewables,
    FolloweeViewables,
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
    PaginatedViewableFolloweesFailureReason,
    PaginatedFollowersFailureReason,
    PaginatedFolloweesFailureReason,
} from "./types";

export default class SocialsManager {
    static readonly shared = new SocialsManager();

    private constructor() {}

    async isFollowedRelationshipExists(parameters: {
        followeeId: String;
        followerId: String;
    }): Promise<Boolean> {
        const followeeDocumentRef =
            DatabaseAssistant.shared.followeeDocumentRef({
                userId: parameters.followerId,
                followeeId: parameters.followeeId,
            });

        const followeeDocument = await followeeDocumentRef.get();

        if (followeeDocument.exists) {
            return true;
        }

        return false;
    }

    async isFollowingRelationshipExists(parameters: {
        followeeId: String;
        followerId: String;
    }): Promise<Boolean> {
        const followerDocumentRef =
            DatabaseAssistant.shared.followerDocumentRef({
                userId: parameters.followeeId,
                followerId: parameters.followerId,
            });

        const followerDocument = await followerDocumentRef.get();

        if (followerDocument.exists) {
            return true;
        }

        return false;
    }

    async followingRelationshipStatuses(parameters: {
        followeeIdentifiers: String[];
        followerId: String;
    }): Promise<Value<Boolean>> {
        if (parameters.followeeIdentifiers.length === 0) {
            return {};
        }

        const followeeDocumentRefs = parameters.followeeIdentifiers.map(
            (followeeId) => {
                const followeeDocumentRef =
                    DatabaseAssistant.shared.followeeDocumentRef({
                        userId: parameters.followerId,
                        followeeId: followeeId,
                    });

                return followeeDocumentRef;
            }
        );

        const followeeDocuments = await DatabaseAssistant.shared.all(
            ...followeeDocumentRefs
        );

        const followerRelationshipStatuses: Value<Boolean> = {};

        followeeDocuments.forEach((followeeDocument) => {
            followerRelationshipStatuses[followeeDocument.id] =
                followeeDocument.exists;
        });

        return followerRelationshipStatuses;
    }

    async followedRelationshipStatuses(parameters: {
        followerIdentifiers: String[];
        followeeId: String;
    }): Promise<Value<Boolean>> {
        if (parameters.followerIdentifiers.length === 0) {
            return {};
        }

        const followerDocumentRefs = parameters.followerIdentifiers.map(
            (followerId) => {
                const followerDocumentRef =
                    DatabaseAssistant.shared.followerDocumentRef({
                        userId: parameters.followeeId,
                        followerId: followerId,
                    });

                return followerDocumentRef;
            }
        );

        const followerDocuments = await DatabaseAssistant.shared.all(
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
        followeeId: String;
        followerId: String;
    }): Promise<Success<Empty> | Failure<FollowFailureReason>> {
        const isFolloweeExists = await UsersManager.shared.exists({
            id: parameters.followeeId,
        });

        if (!isFolloweeExists) {
            const reply = new Failure<FollowFailureReason>(
                FollowFailureReason.followeeDoesNotExists
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

        const isFollowRelationshipExists =
            await this.isFollowingRelationshipExists({
                followerId: parameters.followerId,
                followeeId: parameters.followeeId,
            });

        if (isFollowRelationshipExists) {
            const reply = new Failure<FollowFailureReason>(
                FollowFailureReason.relationshipAlreadyExists
            );

            return reply;
        }

        const followFeed = StreamAssistant.shared.timelineFeed.follow({
            followerUserId: parameters.followerId,
            followeeUserId: parameters.followeeId,
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

        const followeeData: Following = {
            followeeId: parameters.followeeId,
            creationDate: Dately.shared.now(),
        };

        const followeeUserDocumentRef =
            DatabaseAssistant.shared.userDocumentRef({
                userId: parameters.followeeId,
            });
        const followerUserDocumentRef =
            DatabaseAssistant.shared.userDocumentRef({
                userId: parameters.followerId,
            });

        const followersCollection =
            DatabaseAssistant.shared.followersCollectionRef({
                userId: parameters.followeeId,
            });

        const followeesCollectin =
            DatabaseAssistant.shared.followeesCollectionRef({
                userId: parameters.followerId,
            });

        const followerDataDocumentRef = followersCollection.doc(
            parameters.followerId.valueOf()
        );
        const followeeDataDocumentRef = followeesCollectin.doc(
            parameters.followeeId.valueOf()
        );

        try {
            await DatabaseAssistant.shared.transaction(async (transaction) => {
                const followeeUserDocument =
                    await followeeUserDocumentRef.get();
                const followerUserDocument =
                    await followerUserDocumentRef.get();

                const followeeUser =
                    followeeUserDocument.data() as unknown as User;
                const followerUser =
                    followerUserDocument.data() as unknown as User;

                transaction.set(followeeDataDocumentRef, followeeData);
                transaction.set(followerDataDocumentRef, followerData);

                transaction.update(followerUserDocumentRef, {
                    "socialDetails.followingsCount":
                        followerUser.socialDetails.followeesCount.valueOf() + 1,
                });

                transaction.update(followeeUserDocumentRef, {
                    "socialDetails.followersCount":
                        followeeUser.socialDetails.followersCount.valueOf() + 1,
                });
            });

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
        followeeId: String;
        followerId: String;
    }): Promise<Success<Empty> | Failure<UnfollowFailureReason>> {
        const isFollowedRelationshipExists =
            await this.isFollowedRelationshipExists({
                followeeId: parameters.followeeId,
                followerId: parameters.followerId,
            });

        const isFollowingRelationshipExists =
            await this.isFollowingRelationshipExists({
                followeeId: parameters.followeeId,
                followerId: parameters.followerId,
            });

        if (!isFollowedRelationshipExists && !isFollowingRelationshipExists) {
            const reply = new Failure<UnfollowFailureReason>(
                UnfollowFailureReason.relationshipDoesNotExists
            );

            return reply;
        }

        const unfollowFeed = StreamAssistant.shared.timelineFeed.unfollow({
            followerUserId: parameters.followerId,
            followeeUserId: parameters.followeeId,
        });

        if (unfollowFeed instanceof Failure) {
            const reply = new Failure<UnfollowFailureReason>(
                UnfollowFailureReason.unknown
            );

            return reply;
        }

        const followeeUserDocumentRef =
            DatabaseAssistant.shared.userDocumentRef({
                userId: parameters.followeeId,
            });
        const followerUserDocumentRef =
            DatabaseAssistant.shared.userDocumentRef({
                userId: parameters.followerId,
            });

        const followersCollection =
            DatabaseAssistant.shared.followersCollectionRef({
                userId: parameters.followeeId,
            });

        const followeesCollectin =
            DatabaseAssistant.shared.followeesCollectionRef({
                userId: parameters.followerId,
            });

        const followerDataDocumentRef = followersCollection.doc(
            parameters.followerId.valueOf()
        );
        const followeeDataDocumentRef = followeesCollectin.doc(
            parameters.followeeId.valueOf()
        );

        try {
            await DatabaseAssistant.shared.transaction(async (transaction) => {
                const followeeUserDocument =
                    await followeeUserDocumentRef.get();
                const followerUserDocument =
                    await followerUserDocumentRef.get();

                const followeeUser =
                    followeeUserDocument.data() as unknown as User;
                const followerUser =
                    followerUserDocument.data() as unknown as User;

                transaction.delete(followeeDataDocumentRef);
                transaction.delete(followerDataDocumentRef);

                transaction.update(followerUserDocumentRef, {
                    "socialDetails.followingsCount": Math.max(
                        followerUser.socialDetails.followeesCount.valueOf() - 1,
                        0
                    ),
                });

                transaction.update(followeeUserDocumentRef, {
                    "socialDetails.followersCount": Math.max(
                        followeeUser.socialDetails.followersCount.valueOf() - 1,
                        0
                    ),
                });
            });

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
        const followersCollection =
            DatabaseAssistant.shared.followeesCollectionRef({
                userId: parameters.userId,
            });

        const limit =
            parameters.limit?.valueOf() || kMaximumPaginatedPageLength;

        let query = followersCollection
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

    private async paginatedFollowees(
        parameters: {
            userId: String;
        } & PaginationParameters
    ): Promise<
        Success<Paginated<Following>> | Failure<PaginatedFolloweesFailureReason>
    > {
        const followeesCollection =
            DatabaseAssistant.shared.followeesCollectionRef({
                userId: parameters.userId,
            });

        const limit =
            parameters.limit?.valueOf() || kMaximumPaginatedPageLength;

        let query = followeesCollection
            .orderBy("creationDate")
            .limit(limit + 1);

        if (parameters.nextToken !== undefined) {
            query = query.startAt(parameters.nextToken);
        }

        try {
            const querySnapshot = await query.get();

            if (querySnapshot.empty) {
                const paginatedFollowees: Paginated<Following> = {
                    page: [],
                };

                const reply = new Success<Paginated<Following>>(
                    paginatedFollowees
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

            const followees = querySnapshot.docs.map((queryDocument) => {
                const followee = queryDocument.data() as unknown as Following;

                return followee;
            });

            const paginatedFollowees: Paginated<Following> = {
                page: followees,
                nextToken: nextToken,
            };

            const reply = new Success<Paginated<Following>>(paginatedFollowees);

            return reply;
        } catch (e) {
            logger(e, LogLevel.attention, [this, this.paginatedFollowees]);

            const reply = new Failure<PaginatedFolloweesFailureReason>(
                PaginatedFolloweesFailureReason.unknown
            );

            return reply;
        }
    }

    async paginatedViewableFollowees(
        parameters: {
            userId: String;
        } & ViewablesParameters &
            PaginationParameters
    ): Promise<
        | Success<Paginated<ViewableFollowee>>
        | Failure<PaginatedViewableFolloweesFailureReason>
    > {
        const limit =
            parameters.limit?.valueOf() || kMaximumPaginatedPageLength;

        const followeesResult = await this.paginatedFollowees({
            userId: parameters.userId,
            limit: limit,
            nextToken: parameters.nextToken,
        });

        if (followeesResult instanceof Failure) {
            const reply = new Failure<PaginatedViewableFolloweesFailureReason>(
                PaginatedViewableFolloweesFailureReason.unknown
            );

            return reply;
        }

        const followees = followeesResult.data;

        if (followees.page.length === 0) {
            const paginatedFollowees: Paginated<ViewableFollowee> = {
                page: [],
            };

            const reply = new Success<Paginated<ViewableFollowee>>(
                paginatedFollowees
            );

            return reply;
        }

        const viewableUsersResult = await UsersManager.shared.viewableUsers({
            userIdentifiers: followees.page.map(
                (followerData) => followerData.followeeId
            ),
            viewerId: parameters.viewerId,
        });

        if (viewableUsersResult instanceof Failure) {
            const reply = new Failure<PaginatedViewableFolloweesFailureReason>(
                PaginatedViewableFolloweesFailureReason.unknown
            );

            return reply;
        }

        const viewableUsers = viewableUsersResult.data;

        const viewableFolloweesData = followees.page.map((followeeData) => {
            const followeeViewables: FolloweeViewables = {
                followee: viewableUsers[followeeData.followeeId.valueOf()],
            };

            const viewableFollowee: ViewableFollowee = {
                ...followeeData,
                viewables: followeeViewables,
            };

            return viewableFollowee;
        });

        const paginatedFollowees: Paginated<ViewableFollowee> = {
            page: viewableFolloweesData,
            nextToken: followees.nextToken,
        };

        const reply = new Success<Paginated<ViewableFollowee>>(
            paginatedFollowees
        );

        return reply;
    }
}
