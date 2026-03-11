import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCardAttachment, ProjectChecklist, ProjectColumn, ProjectLabel, ProjectWiki } from "@/core/models";
import { TPickedModel } from "@/core/models/ModelRegistry";
import { Utils } from "@langboard/core/utils";
import { ESocketTopic } from "@langboard/core/enums";
import { reorder } from "@atlaskit/pragmatic-drag-and-drop/reorder";

export interface IColumnOrderChangedResponse {
    uid: string;
    order: number;
}

export interface IUseColumnOrderChangedHandlersProps extends IBaseUseSocketHandlersProps<IColumnOrderChangedResponse> {
    type: "ProjectColumn" | "ProjectCardAttachment" | "ProjectChecklist" | "ProjectWiki" | "ProjectLabel";
    params?: Record<string, string>;
    topicId: string;
    sortedModels: TPickedModel<IUseColumnOrderChangedHandlersProps["type"]>[];
}

const COLUMN_ORDER_CHANGED_CONFIG = {
    ProjectColumn: {
        onEventName: SocketEvents.SERVER.BOARD.COLUMN.ORDER_CHANGED,
        targetModel: ProjectColumn.Model,
        topic: ESocketTopic.Board,
    },
    ProjectCardAttachment: {
        onEventName: SocketEvents.SERVER.BOARD.CARD.ATTACHMENT.ORDER_CHANGED,
        targetModel: ProjectCardAttachment.Model,
        topic: ESocketTopic.BoardCard,
    },
    ProjectChecklist: {
        onEventName: SocketEvents.SERVER.BOARD.CARD.CHECKLIST.ORDER_CHANGED,
        targetModel: ProjectChecklist.Model,
        topic: ESocketTopic.Board,
    },
    ProjectWiki: {
        onEventName: SocketEvents.SERVER.BOARD.WIKI.ORDER_CHANGED,
        targetModel: ProjectWiki.Model,
        topic: ESocketTopic.BoardWiki,
    },
    ProjectLabel: {
        onEventName: SocketEvents.SERVER.BOARD.LABEL.ORDER_CHANGED,
        targetModel: ProjectLabel.Model,
        topic: ESocketTopic.Board,
    },
} as const;

const useColumnOrderChangedHandlers = ({ callback, type, params, topicId, sortedModels }: IUseColumnOrderChangedHandlersProps) => {
    const { onEventName, targetModel, topic } = COLUMN_ORDER_CHANGED_CONFIG[type];
    const sendEventName = "";

    return useSocketHandler({
        topic,
        topicId,
        eventKey: `${new Utils.String.Case(type).toKebab()}-column-order-changed`,
        onProps: {
            name: onEventName,
            params,
            callback,
            responseConverter: (data) => {
                const model = targetModel.getModel(data.uid);
                if (model && model.order !== data.order) {
                    const reordered = reorder({ list: sortedModels, startIndex: model.order, finishIndex: data.order });
                    for (let i = 0; i < reordered.length; ++i) {
                        reordered[i].order = i;
                    }
                }
                return data;
            },
        },
        sendProps: {
            name: sendEventName,
        },
    });
};

export default useColumnOrderChangedHandlers;
