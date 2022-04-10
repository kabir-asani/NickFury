import { Success, Failure } from "../../utils/typescriptx/typescriptx";
import { User, ViewableUser } from "./models";
import { SocialsManager } from "./socialsManager/socialsManager";
import { ViewableUserFailure } from "./types";
import { UsersManager } from "./usersManager";

export class ViewableUserX {
    private user: User;

    constructor(parameters: {
        user: User;
    }) {
        this.user = parameters.user;
    }

    async viewable(parameters: {
        viewerId: String;
        options?: {
            enableViewerCheck?: Boolean;
        };
    }): Promise<Success<ViewableUser> | Failure<ViewableUserFailure>> {
        if (parameters.options?.enableViewerCheck === true) {
            const isViewerExists = await UsersManager.shared.exists({
                userId: parameters.viewerId
            });

            if (!isViewerExists) {
                const result = new Failure<ViewableUserFailure>(ViewableUserFailure.VIEWER_DOES_NOT_EXISTS);
                return result;
            }
        }

        const isFollower = await SocialsManager.shared.isFollower({
            followingUserId: this.user.id,
            followerUserId: parameters.viewerId
        });

        const viewableUser: ViewableUser = {
            ...this.user,
            viewerMeta: {
                follower: isFollower
            },
        };

        const result = new Success<ViewableUser>(viewableUser);
        return result;
    }
}

class ViewableUsersX {
    private users: User[];

    constructor(parameters: {
        users: User[];
    }) {
        this.users = parameters.users;
    }

    async viewable(parameters: {
        viewerId: String;
        options?: {
            enableViewerCheck?: Boolean;
        };
    }): Promise<Success<ViewableUser[]> | Failure<ViewableUserFailure>> {
        if (parameters.options?.enableViewerCheck === true) {
            const isViewerExists = await UsersManager.shared.exists({
                userId: parameters.viewerId
            });

            if (!isViewerExists) {
                const result = new Failure<ViewableUserFailure>(ViewableUserFailure.VIEWER_DOES_NOT_EXISTS);
                return result;
            }
        }

        const viewableUsers: ViewableUser[] = [];

        for (const user of this.users) {
            const viewableUserX = new ViewableUserX({
                user: user
            });

            const viewableUserResult = await viewableUserX.viewable({
                viewerId: parameters.viewerId,
            });

            if (viewableUserResult instanceof Failure) {
                return viewableUserResult;
            }

            const viewableUser = viewableUserResult.data;
            viewableUsers.push(viewableUser);
        }

        const result = new Success<ViewableUser[]>(viewableUsers);
        return result;
    }
}