import useRowOrderChangedHandlers, { IUseRowOrderChangedHandlersProps } from "@/controllers/socket/shared/useRowOrderChangedHandlers";
import useSocketHandler from "@/core/helpers/SocketHandler";
import useSwitchSocketHandlers, { TSocketHandler } from "@/core/hooks/useSwitchSocketHandlers";
import { ModelRegistry, TPickedModel, TPickedModelClass } from "@/core/models/ModelRegistry";
import { ISocketContext } from "@/core/providers/SocketProvider";
import { useMemo } from "react";

export interface IRow {
    uid: string;
    order: number;
}

export interface IUseRowReorderedProps<TRowModelName extends IUseRowOrderChangedHandlersProps["type"]> {
    type: TRowModelName;
    eventNameParams?: IUseRowOrderChangedHandlersProps["params"];
    topicId: string;
    rowFilter: (model: TPickedModel<TRowModelName>) => bool;
    rowDependencies?: React.DependencyList;
    columnUID: string;
    socket: ISocketContext;
    updater: [unknown, React.DispatchWithoutAction];
    otherHandlers?: TSocketHandler[];
}

export interface IUseRowReorderedReturn<TRowModelName extends IUseRowOrderChangedHandlersProps["type"]> {
    rows: TPickedModel<TRowModelName>[];
    sendRowOrderChanged: ReturnType<typeof useSocketHandler>["send"];
}

function useRowReordered<TRowModelName extends IUseRowOrderChangedHandlersProps["type"]>({
    type,
    eventNameParams,
    topicId,
    rowFilter,
    rowDependencies,
    columnUID,
    socket,
    updater,
    otherHandlers,
}: IUseRowReorderedProps<TRowModelName>): IUseRowReorderedReturn<TRowModelName> {
    const [updated, forceUpdate] = updater;
    const flatRows = (ModelRegistry[type].Model as TPickedModelClass<TRowModelName>).useModels(rowFilter, [
        updated,
        columnUID,
        ...(rowDependencies ?? []),
    ]);
    const rows = useMemo(() => [...flatRows].sort((a, b) => a.order - b.order), [flatRows]);
    const handlers = useMemo(
        () =>
            useRowOrderChangedHandlers({
                type,
                topicId,
                params: eventNameParams,
                callback: (data) => {
                    if (data.move_type !== "in_column" && data.column_uid !== columnUID) {
                        return;
                    }

                    forceUpdate();
                },
            }),
        [type, topicId, eventNameParams, columnUID, forceUpdate]
    );
    const mergedHandlers = useMemo(() => [handlers, ...(otherHandlers ?? [])], [handlers, otherHandlers]);

    useSwitchSocketHandlers({
        socket,
        handlers: mergedHandlers,
        dependencies: mergedHandlers,
    });

    return { rows, sendRowOrderChanged: handlers.send };
}

export default useRowReordered;
