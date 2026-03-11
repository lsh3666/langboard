import useColumnOrderChangedHandlers, { IUseColumnOrderChangedHandlersProps } from "@/controllers/socket/shared/useColumnOrderChangedHandlers";
import useSwitchSocketHandlers, { TSocketHandler } from "@/core/hooks/useSwitchSocketHandlers";
import { TPickedModel } from "@/core/models/ModelRegistry";
import { ISocketContext } from "@/core/providers/SocketProvider";
import { useMemo } from "react";

export interface IColumn {
    uid: string;
    order: number;
}

export interface IUseColumnReorderedProps<TColumnModelName extends IUseColumnOrderChangedHandlersProps["type"]> {
    type: TColumnModelName;
    eventNameParams?: IUseColumnOrderChangedHandlersProps["params"];
    topicId: string;
    columns: TPickedModel<TColumnModelName>[];
    socket: ISocketContext;
    updater: [unknown, React.DispatchWithoutAction];
    otherHandlers?: TSocketHandler[];
}

function useColumnReordered<TColumnModelName extends IUseColumnOrderChangedHandlersProps["type"]>({
    type,
    eventNameParams,
    topicId,
    columns: flatColumns,
    socket,
    updater,
    otherHandlers,
}: IUseColumnReorderedProps<TColumnModelName>) {
    const [updated, forceUpdate] = updater;
    const columns = useMemo(() => [...flatColumns].sort((a, b) => a.order - b.order), [updated, flatColumns]);
    const handlers = useMemo(
        () =>
            useColumnOrderChangedHandlers({
                type,
                topicId,
                params: eventNameParams,
                sortedModels: columns,
                callback: () => {
                    forceUpdate();
                },
            }),
        [type, topicId, eventNameParams, columns, forceUpdate]
    );
    const mergedHandlers = useMemo(() => [handlers, ...(otherHandlers ?? [])], [handlers, otherHandlers]);

    useSwitchSocketHandlers({
        socket,
        handlers: mergedHandlers,
        dependencies: mergedHandlers,
    });

    return { columns, sendColumnOrderChanged: handlers.send };
}

export default useColumnReordered;
