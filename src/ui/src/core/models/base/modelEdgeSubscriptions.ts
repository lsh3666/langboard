import { Utils } from "@langboard/core/utils";
import type { IModelMap, TPickedModel, TPickedModelClass } from "@/core/models/ModelRegistry";

type TCommonModel = TPickedModel<keyof IModelMap>;
type TChildEdgeMap<TChild> = Partial<Record<keyof IModelMap, TChild>>;

export type TParentEdgeMap<TChild> = {
    [uid: string]: TChildEdgeMap<TChild>;
};

export type TEdgeMap<TChild> = Partial<Record<keyof IModelMap, TParentEdgeMap<TChild>>>;

export type TSubscriptionMap = {
    CONNECTED: TEdgeMap<{ [key: string]: (uids: string[]) => void }>;
    DISCONNECTED: TEdgeMap<{ [uid: string]: { [key: string]: () => void } }>;
};

interface IBaseSubscriptionContext {
    event: keyof TSubscriptionMap;
    key: string;
    source: TCommonModel;
}

export type TConnectedSubscriptionContext = IBaseSubscriptionContext & {
    event: "CONNECTED";
    targetClass: TPickedModelClass<keyof IModelMap>;
};

export type TDisconnectedSubscriptionContext = IBaseSubscriptionContext & {
    event: "DISCONNECTED";
    target: TCommonModel;
};

export type TConnectedSubscribeContext = TConnectedSubscriptionContext & {
    callback: (uids: string[]) => void;
};

export type TDisconnectedSubscribeContext = TDisconnectedSubscriptionContext & {
    callback: () => void;
};

export type TConnectedNotifyContext = Omit<TConnectedSubscriptionContext, "key"> & {
    uids: string[];
};

export type TDisconnectedNotifyContext = Omit<TDisconnectedSubscriptionContext, "key" | "target"> & {
    target: { modelName: keyof IModelMap; uid: string };
};

export type TSubscriptionContext = TConnectedSubscriptionContext | TDisconnectedSubscriptionContext;
export type TSubscribeContext = TConnectedSubscribeContext | TDisconnectedSubscribeContext;
export type TNotifyContext = TConnectedNotifyContext | TDisconnectedNotifyContext;

export const createSubscriptionMap = (): TSubscriptionMap => {
    return {
        CONNECTED: {},
        DISCONNECTED: {},
    };
};

export const subscribeModelEdge = ({
    subscriptions,
    convertModelName,
    context,
}: {
    subscriptions: TSubscriptionMap;
    convertModelName: (name: keyof IModelMap) => keyof IModelMap;
    context: TSubscribeContext;
}) => {
    const { event, key, source, callback } = context;
    const sourceModelName = convertModelName(source.MODEL_NAME);

    if (event === "CONNECTED") {
        const targetModelName = convertModelName(context.targetClass.MODEL_NAME);
        const targetMap = Utils.Object.getDeepRecordMap(true, subscriptions.CONNECTED, sourceModelName, source.uid, targetModelName);
        targetMap[key] = callback;

        return () => {
            unsubscribeModelEdge({
                subscriptions,
                convertModelName,
                context: {
                    event: "CONNECTED",
                    key,
                    source,
                    targetClass: context.targetClass,
                },
            });
        };
    }

    const targetModelName = convertModelName(context.target.MODEL_NAME);
    const targetMap = Utils.Object.getDeepRecordMap(
        true,
        subscriptions.DISCONNECTED,
        sourceModelName,
        source.uid,
        targetModelName,
        context.target.uid
    );
    targetMap[key] = callback;

    return () => {
        unsubscribeModelEdge({
            subscriptions,
            convertModelName,
            context: {
                event: "DISCONNECTED",
                key,
                source,
                target: context.target,
            },
        });
    };
};

export const unsubscribeModelEdge = ({
    subscriptions,
    convertModelName,
    context,
}: {
    subscriptions: TSubscriptionMap;
    convertModelName: (name: keyof IModelMap) => keyof IModelMap;
    context: TSubscriptionContext;
}) => {
    const { event, key, source } = context;
    const sourceModelName = convertModelName(source.MODEL_NAME);

    if (event === "CONNECTED") {
        const targetModelName = convertModelName(context.targetClass.MODEL_NAME);
        Utils.Object.deleteDeepRecordMap(subscriptions.CONNECTED, sourceModelName, source.uid, targetModelName, key);
        return;
    }

    const targetModelName = convertModelName(context.target.MODEL_NAME);
    Utils.Object.deleteDeepRecordMap(subscriptions.DISCONNECTED, sourceModelName, source.uid, targetModelName, context.target.uid, key);
};

export const notifyModelEdge = ({
    subscriptions,
    convertModelName,
    context,
}: {
    subscriptions: TSubscriptionMap;
    convertModelName: (name: keyof IModelMap) => keyof IModelMap;
    context: TNotifyContext;
}) => {
    const { event, source } = context;
    const sourceModelName = convertModelName(source.MODEL_NAME);

    let targetSubscriptions;
    if (event === "CONNECTED") {
        const targetModelName = convertModelName(context.targetClass.MODEL_NAME);
        targetSubscriptions = Utils.Object.getDeepRecordMap(false, subscriptions.CONNECTED, sourceModelName, source.uid, targetModelName);
    } else {
        const { modelName, uid } = context.target;
        targetSubscriptions = Utils.Object.getDeepRecordMap(false, subscriptions.DISCONNECTED, sourceModelName, source.uid, modelName, uid);
    }

    if (!targetSubscriptions) {
        return;
    }

    Object.values(targetSubscriptions).forEach((callback) => {
        if (event === "CONNECTED") {
            callback(context.uids);
            return;
        }

        (callback as () => void)();
    });
};
