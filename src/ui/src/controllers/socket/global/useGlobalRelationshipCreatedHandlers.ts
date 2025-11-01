import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { GlobalRelationshipType } from "@/core/models";
import { ESocketTopic } from "@langboard/core/enums";

export interface IGlobalRelationshipCreatedRawResponse {
    global_relationships: GlobalRelationshipType.Interface[];
}

const useGlobalRelationshipCreatedHandlers = ({ callback }: IBaseUseSocketHandlersProps<{}>) => {
    return useSocketHandler<{}, IGlobalRelationshipCreatedRawResponse>({
        topic: ESocketTopic.Global,
        eventKey: "global-relationship-created",
        onProps: {
            name: SocketEvents.SERVER.GLOBALS.GLOBAL_RELATIONSHIPS.CREATED,
            callback,
            responseConverter: (data) => {
                GlobalRelationshipType.Model.fromArray(data.global_relationships, true);
                return {};
            },
        },
    });
};

export default useGlobalRelationshipCreatedHandlers;
