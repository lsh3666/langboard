import Toast from "@/components/base/Toast";
import { Routing, SocketEvents } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { AuthUser, User } from "@/core/models";
import { cleanModels } from "@/core/models/Base";
import { getAuthStore } from "@/core/stores/AuthStore";
import { t } from "i18next";
import { ESocketTopic } from "@langboard/core/enums";

export interface IUseUserDeletedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    user: User.TModel | AuthUser.TModel;
}

const useUserDeletedHandlers = ({ user, callback }: IUseUserDeletedHandlersProps) => {
    let topic: ESocketTopic;
    if (user.MODEL_NAME === "User") {
        topic = ESocketTopic.User;
    } else {
        topic = ESocketTopic.UserPrivate;
    }

    return useSocketHandler<{}, {}>({
        topic: topic,
        topicId: user.uid,
        eventKey: `user-deleted-${user.uid}`,
        onProps: {
            name: SocketEvents.SERVER.USER.DELETED,
            params: { uid: user.uid },
            callback,
            responseConverter: async () => {
                if (user.MODEL_NAME === "AuthUser") {
                    await api.post(Routing.API.AUTH.SIGN_OUT);
                    cleanModels();
                    getAuthStore().removeToken();
                    Toast.Add.error(t("auth.You have been deleted."));
                } else {
                    if (user.type !== User.Model.UNKNOWN_TYPE) {
                        user.setDeleted();
                    }
                }
                return {};
            },
        },
    });
};

export default useUserDeletedHandlers;
