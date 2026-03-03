import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { User } from "@/core/models";
import { ESettingSocketTopicID, ESocketTopic } from "@langboard/core/enums";
import { ApiKeyRole } from "@/core/models/roles";

export interface IUserApiKeyRolesUpdatedRawResponse {
    roles: ApiKeyRole.TActions[];
}

export interface IUseUserApiKeyRolesUpdatedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    user: User.TModel;
    isPrivate: bool;
}

const useUserApiKeyRolesUpdatedHandlers = ({ callback, user, isPrivate }: IUseUserApiKeyRolesUpdatedHandlersProps) => {
    return useSocketHandler<{}, IUserApiKeyRolesUpdatedRawResponse>({
        topic: isPrivate ? ESocketTopic.UserPrivate : ESocketTopic.AppSettings,
        topicId: isPrivate ? user.uid : ESettingSocketTopicID.User,
        eventKey: `user-api-key-roles-updated-${user.uid}`,
        onProps: {
            name: SocketEvents.SERVER.USER.API_KEY_ROLES_UPDATED,
            params: {
                uid: user.uid,
            },
            callback,
            responseConverter: (data) => {
                user.api_key_role_actions = data.roles;

                return {};
            },
        },
    });
};

export default useUserApiKeyRolesUpdatedHandlers;
