import { Success, Failure } from "../../utils/typescriptx/typescriptx";
import { User, ViewableUser, UserViewerMeta } from "./models";
import { SocialsManager } from "./socialsManager/socialsManager";
import { ViewableUserFailre } from "./types";
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
    }): Promise<Success<ViewableUser> | Failure<ViewableUserFailre>> {
        if (parameters.options?.enableViewerCheck === true) {
            const isViewerExists = await UsersManager.shared.exists({
                userId: parameters.viewerId
            });

            if (!isViewerExists) {
                const result = new Failure<ViewableUserFailre>(ViewableUserFailre.VIEWER_DOES_NOT_EXISTS);
                return result;
            }
        }

        const isFollower = await SocialsManager.shared.isFollower({
            followingUserId: this.user.id,
            followerUserId: parameters.viewerId
        });

        const viewerMeta: UserViewerMeta = {
            follower: isFollower
        };

        const viewableUser: ViewableUser = {
            ...this.user,
            viewerMeta: viewerMeta,
        };

        const result = new Success<ViewableUser>(viewableUser);
        return result;
    }
}