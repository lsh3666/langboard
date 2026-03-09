import Toast from "@/components/base/Toast";
import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { AuthUser, User } from "@/core/models";
import { t } from "i18next";
import { ESocketTopic, ESettingSocketTopicID } from "@langboard/core/enums";

export interface ISelectedUsersDeletedRawResponse {
    uids: string[];
}

export interface IUseSelectedUsersDeletedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    currentUser: AuthUser.TModel;
    signOut: () => Promise<void>;
}

const useSelectedUsersDeletedHandlers = ({ currentUser, signOut, callback }: IUseSelectedUsersDeletedHandlersProps) => {
    return useSocketHandler<{}, ISelectedUsersDeletedRawResponse>({
        topic: ESocketTopic.AppSettings,
        topicId: ESettingSocketTopicID.User,
        eventKey: "selected-user-deleted",
        onProps: {
            name: SocketEvents.SERVER.SETTINGS.USERS.SELECTIONS_DELETED,
            callback,
            responseConverter: (data) => {
                if (data.uids.includes(currentUser.uid)) {
                    signOut().finally(() => {
                        Toast.Add.error(t("auth.You have been deleted."));
                    });
                } else {
                    User.Model.getModels(data.uids).forEach((user) => {
                        user.setDeleted();
                    });
                }
                return {};
            },
        },
    });
};

export default useSelectedUsersDeletedHandlers;
