/* eslint-disable @typescript-eslint/no-explicit-any */
import { IStreamCallbackMap, useSocketOutsideProvider } from "@/core/providers/SocketProvider";
import { TDefaultEvents, TEventName } from "@/core/stores/SocketStore";
import { Utils } from "@langboard/core/utils";
import { ESocketTopic } from "@langboard/core/enums";

export interface IBaseUseSocketStreamHandlersProps {
    callbacks: IStreamCallbackMap<any, any, any>;
}

interface IBaseUseSocketStreamHandlerProps {
    topic?: ESocketTopic;
    topicId?: string;
    eventKey: string;
    onProps: {
        name: Exclude<TEventName, TDefaultEvents>;
        params?: Record<string, string>;
        callbacks: IStreamCallbackMap<any, any, any>;
    };
}

const useSocketStreamHandler = (props: IBaseUseSocketStreamHandlerProps) => {
    const socket = useSocketOutsideProvider();
    const { topic, topicId, onProps, eventKey } = props;
    const eventName = onProps.params ? Utils.String.format(onProps.name, onProps.params) : onProps.name;
    const callbacks = onProps.callbacks;
    const on = () => {
        socket.stream({
            topic: topic as never,
            topicId,
            event: eventName,
            eventKey,
            callbacks,
        });

        return () => {
            socket.streamOff({
                topic: topic as never,
                topicId,
                event: eventName,
                eventKey,
                callbacks,
            });
        };
    };

    return {
        topic,
        topicId,
        eventKey,
        on,
    };
};

export default useSocketStreamHandler;
