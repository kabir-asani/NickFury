import { Failure, Success } from "../../../utils/typescriptx/typescriptx";
import { UsersManager } from "../usersManager";
import { ViewableUserX } from "../viewables";
import { Follower, Follower as Following, ViewableFollower, ViewableFollowing } from "./models";
import { ViewableFollowerFailure, ViewableFollowingFailure } from "./types";

class ViewableFollowerX {
    private follower: Following;

    constructor(parameters: {
        follower: Following;
    }) {
        this.follower = parameters.follower;
    }

    async viewable(parameters: {
        viewerId: String;
        options?: {
            enableViewerCheck?: Boolean;
        };
    }): Promise<Success<ViewableFollower> | Failure<ViewableFollowerFailure>> {
        if (parameters.options?.enableViewerCheck === true) {
            const isViewerExists = await UsersManager.shared.exists({
                userId: parameters.viewerId
            });

            if (!isViewerExists) {
                const result = new Failure<ViewableFollowerFailure>(ViewableFollowerFailure.VIEWER_DOES_NOT_EXISTS);
                return result;
            }
        }

        const userResult = await UsersManager.shared.user({
            userId: this.follower.userId
        });

        if (userResult instanceof Failure) {
            switch (userResult.reason) {
                default: {
                    const result = new Failure<ViewableFollowerFailure>(ViewableFollowerFailure.UNKNOWN);
                    return result;
                }
            }
        }

        const user = userResult.data;

        const viewableUserX = new ViewableUserX({
            user: user
        });

        const viewableUserResult = await viewableUserX.viewable({
            viewerId: parameters.viewerId
        });

        if (viewableUserResult instanceof Failure) {
            switch (viewableUserResult.reason) {
                default: {
                    const result = new Failure<ViewableFollowerFailure>(ViewableFollowerFailure.UNKNOWN);
                    return result;
                }
            }
        }

        const viewableUser = viewableUserResult.data;

        const viewableFollower: ViewableFollower = {
            ...this.follower,
            user: viewableUser
        };

        const result = new Success<ViewableFollower>(viewableFollower);
        return result;
    }
}

class ViewableFollowingX {
    private following: Following;

    constructor(parameters: {
        following: Following;
    }) {
        this.following = parameters.following;
    }

    async viewable(parameters: {
        viewerId: String;
        options?: {
            enableViewerCheck?: Boolean;
        };
    }): Promise<Success<ViewableFollowing> | Failure<ViewableFollowingFailure>> {
        if (parameters.options?.enableViewerCheck === true) {
            const isViewerExists = await UsersManager.shared.exists({
                userId: parameters.viewerId
            });

            if (!isViewerExists) {
                const result = new Failure<ViewableFollowingFailure>(ViewableFollowingFailure.VIEWER_DOES_NOT_EXISTS);
                return result;
            }
        }

        const userResult = await UsersManager.shared.user({
            userId: this.following.userId
        });

        if (userResult instanceof Failure) {
            switch (userResult.reason) {
                default: {
                    const result = new Failure<ViewableFollowingFailure>(ViewableFollowingFailure.UNKNOWN);
                    return result;
                }
            }
        }

        const user = userResult.data;

        const viewableUserX = new ViewableUserX({
            user: user
        });

        const viewableUserResult = await viewableUserX.viewable({
            viewerId: parameters.viewerId
        });

        if (viewableUserResult instanceof Failure) {
            switch (viewableUserResult.reason) {
                default: {
                    const result = new Failure<ViewableFollowingFailure>(ViewableFollowingFailure.UNKNOWN);
                    return result;
                }
            }
        }

        const viewableUser = viewableUserResult.data;

        const viewableFollowing: ViewableFollower = {
            ...this.following,
            user: viewableUser
        };

        const result = new Success<ViewableFollowing>(viewableFollowing);
        return result;
    }
}

class ViewableFollowersX {
    private followers: Follower[];

    constructor(parameters: {
        followers: Follower[];
    }) {
        this.followers = parameters.followers;
    }

    async viewable(parameters: {
        viewerId: String;
        options?: {
            enableViewerCheck?: Boolean;
        };
    }): Promise<Success<ViewableFollower[]> | Failure<ViewableFollowerFailure>> {
        if (parameters.options?.enableViewerCheck === true) {
            const isViewerExists = await UsersManager.shared.exists({
                userId: parameters.viewerId
            });

            if (!isViewerExists) {
                const result = new Failure<ViewableFollowerFailure>(ViewableFollowerFailure.VIEWER_DOES_NOT_EXISTS);
                return result;
            }
        }

        const viewableFollowers: ViewableFollower[] = [];

        for (const follower of this.followers) {
            const viewableFollowerX = new ViewableFollowerX({
                follower: follower
            });

            const viewableFollowerResult = await viewableFollowerX.viewable({
                viewerId: parameters.viewerId,
            });

            if (viewableFollowerResult instanceof Failure) {
                return viewableFollowerResult;
            }

            const viewableFollower = viewableFollowerResult.data;
            viewableFollowers.push(viewableFollower);
        }

        const result = new Success<ViewableFollower[]>(viewableFollowers);
        return result;
    }
}


class ViewableFollowingsX {
    private followings: Following[];

    constructor(parameters: {
        followings: Following[];
    }) {
        this.followings = parameters.followings;
    }

    async viewable(parameters: {
        viewerId: String;
        options?: {
            enableViewerCheck?: Boolean;
        };
    }): Promise<Success<ViewableFollowing[]> | Failure<ViewableFollowingFailure>> {
        if (parameters.options?.enableViewerCheck === true) {
            const isViewerExists = await UsersManager.shared.exists({
                userId: parameters.viewerId
            });

            if (!isViewerExists) {
                const result = new Failure<ViewableFollowingFailure>(ViewableFollowingFailure.VIEWER_DOES_NOT_EXISTS);
                return result;
            }
        }

        const viewableFollowings: ViewableFollower[] = [];

        for (const following of this.followings) {
            const viewableFollowingX = new ViewableFollowingX({
                following: following
            });

            const viewableFollowingResult = await viewableFollowingX.viewable({
                viewerId: parameters.viewerId,
            });

            if (viewableFollowingResult instanceof Failure) {
                return viewableFollowingResult;
            }

            const viewableFollowing = viewableFollowingResult.data;
            viewableFollowings.push(viewableFollowing);
        }

        const result = new Success<ViewableFollowing[]>(viewableFollowings);
        return result;
    }
}