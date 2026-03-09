import Toast from "@/components/base/Toast";
import { Routing, SocketEvents } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { AuthUser } from "@/core/models";
import { cleanModels } from "@/core/models/Base";
import { getAuthStore } from "@/core/stores/AuthStore";
import { t } from "i18next";
import { ESocketTopic } from "@langboard/core/enums";

export interface IUseUserDeactivatedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    currentUser: AuthUser.TModel;
}

const useUserDeactivatedHandlers = ({ currentUser, callback }: IUseUserDeactivatedHandlersProps) => {
    return useSocketHandler<{}, {}>({
        topic: ESocketTopic.UserPrivate,
        topicId: currentUser.uid,
        eventKey: `user-deactivated-${currentUser.uid}`,
        onProps: {
            name: SocketEvents.SERVER.USER.DEACTIVATED,
            params: { uid: currentUser.uid },
            callback,
            responseConverter: async () => {
                await api.post(Routing.API.AUTH.SIGN_OUT);
                cleanModels();
                getAuthStore().removeToken();
                Toast.Add.error(t("auth.You have been deactivated."));
                return {};
            },
        },
    });
};

export default useUserDeactivatedHandlers;
