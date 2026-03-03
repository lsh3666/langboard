import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { User } from "@/core/models";
import { ESettingSocketTopicID, ESocketTopic } from "@langboard/core/enums";
import { SettingRole } from "@/core/models/roles";

export interface IUserSettingRolesUpdatedRawResponse {
    roles: SettingRole.TActions[];
}

export interface IUseUserSettingRolesUpdatedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    user: User.TModel;
    isPrivate: bool;
}

const useUserSettingRolesUpdatedHandlers = ({ callback, user, isPrivate }: IUseUserSettingRolesUpdatedHandlersProps) => {
    return useSocketHandler<{}, IUserSettingRolesUpdatedRawResponse>({
        topic: isPrivate ? ESocketTopic.UserPrivate : ESocketTopic.AppSettings,
        topicId: isPrivate ? user.uid : ESettingSocketTopicID.User,
        eventKey: `user-setting-roles-updated-${user.uid}`,
        onProps: {
            name: SocketEvents.SERVER.USER.SETTING_ROLES_UPDATED,
            params: {
                uid: user.uid,
            },
            callback,
            responseConverter: (data) => {
                user.setting_role_actions = data.roles;

                return {};
            },
        },
    });
};

export default useUserSettingRolesUpdatedHandlers;
