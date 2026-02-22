import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { AppSettingModel } from "@/core/models";
import { ESocketTopic, GLOBAL_TOPIC_ID } from "@langboard/core/enums";

export interface ISelectedAppSettingsDeletedRawResponse {
    uids: string[];
}

const useSelectedAppSettingsDeletedHandlers = ({ callback }: IBaseUseSocketHandlersProps<{}>) => {
    return useSocketHandler<{}, ISelectedAppSettingsDeletedRawResponse>({
        topic: ESocketTopic.AppSettings,
        topicId: GLOBAL_TOPIC_ID,
        eventKey: "selected-app-settings-deleted",
        onProps: {
            name: SocketEvents.SERVER.SETTINGS.SELECTIONS_DELETED,
            callback,
            responseConverter: (data) => {
                AppSettingModel.Model.deleteModels(data.uids);

                return {};
            },
        },
    });
};

export default useSelectedAppSettingsDeletedHandlers;
