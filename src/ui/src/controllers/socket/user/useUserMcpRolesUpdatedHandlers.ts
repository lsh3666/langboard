import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { User } from "@/core/models";
import { ESettingSocketTopicID, ESocketTopic } from "@langboard/core/enums";
import { McpRole } from "@/core/models/roles";

export interface IUserMcpRolesUpdatedRawResponse {
    roles: McpRole.TActions[];
}

export interface IUseUserMcpRolesUpdatedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    user: User.TModel;
    isPrivate: bool;
}

const useUserMcpRolesUpdatedHandlers = ({ callback, user, isPrivate }: IUseUserMcpRolesUpdatedHandlersProps) => {
    return useSocketHandler<{}, IUserMcpRolesUpdatedRawResponse>({
        topic: isPrivate ? ESocketTopic.UserPrivate : ESocketTopic.AppSettings,
        topicId: isPrivate ? user.uid : ESettingSocketTopicID.User,
        eventKey: `user-mcp-roles-updated-${user.uid}`,
        onProps: {
            name: SocketEvents.SERVER.USER.MCP_ROLES_UPDATED,
            params: {
                uid: user.uid,
            },
            callback,
            responseConverter: (data) => {
                user.mcp_role_actions = data.roles;

                return {};
            },
        },
    });
};

export default useUserMcpRolesUpdatedHandlers;
