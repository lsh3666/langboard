import type { IModelMap, TPickedModel, TPickedModelClass } from "@/core/models/ModelRegistry";
import { Utils } from "@langboard/core/utils";
import { useEffect, useMemo, useReducer, useState } from "react";
import {
    createSubscriptionMap,
    notifyModelEdge,
    subscribeModelEdge,
    TConnectedSubscriptionContext,
    TConnectedSubscribeContext,
    TDisconnectedSubscriptionContext,
    TDisconnectedSubscribeContext,
    TEdgeMap,
    TSubscriptionContext,
    TSubscribeContext,
    TSubscriptionMap,
    unsubscribeModelEdge,
} from "@/core/models/base/modelEdgeSubscriptions";

type TCommonModel = TPickedModel<keyof IModelMap>;

class _ModelEdgeStore {
    #edgeMap: TEdgeMap<Set<string>>;
    #subscriptions: TSubscriptionMap;

    constructor() {
        this.#edgeMap = {};
        this.#subscriptions = createSubscriptionMap();
    }

    public addEdge(source: TCommonModel, targets: TCommonModel | TCommonModel[]) {
        if (!Utils.Type.isArray(targets)) {
            targets = [targets];
        }

        const sourceModelName = this.#convertModelName(source.MODEL_NAME);
        const targetMap = Utils.Object.getDeepRecordMap(true, this.#edgeMap, sourceModelName, source.uid);
        const notifierMap: Partial<Record<keyof IModelMap, [TPickedModelClass<keyof IModelMap>, string[]]>> = {};
        for (let i = 0; i < targets.length; ++i) {
            const target = targets[i];
            const targetModelName = this.#convertModelName(target.MODEL_NAME);
            if (!targetMap[targetModelName]) {
                targetMap[targetModelName] = new Set();
            }

            if (targetMap[targetModelName].has(target.uid)) {
                continue;
            }

            const targetConstructor = target.constructor as TPickedModelClass<keyof IModelMap>;
            targetMap[targetModelName].add(target.uid);
            if (!notifierMap[targetModelName]) {
                notifierMap[targetModelName] = [targetConstructor, []];
            }
            notifierMap[targetModelName][1].push(target.uid);

            const eventKey = `${sourceModelName}-${source.uid}-${targetModelName}-${target.uid}-edge`;
            targetConstructor.subscribe("DELETION", eventKey, (uids) => {
                if (uids.includes(target.uid)) {
                    this.removeEdge(source, target.uid, targetModelName);
                }
            });
            const unsub = this.subscribe({
                event: "DISCONNECTED",
                key: eventKey,
                source,
                target,
                callback: () => {
                    targetConstructor.unsubscribe("DELETION", eventKey);
                    unsub();
                },
            });
        }

        Object.keys(notifierMap).forEach((modelName) => {
            const [constructor, uids] = notifierMap[modelName] ?? [];
            if (!constructor || !uids?.length) {
                return;
            }

            notifyModelEdge({
                subscriptions: this.#subscriptions,
                convertModelName: this.#convertModelName,
                context: {
                    event: "CONNECTED",
                    source,
                    targetClass: constructor,
                    uids,
                },
            });

            delete notifierMap[modelName];
        });
    }

    public removeEdge(source: TCommonModel, targets: TCommonModel | TCommonModel[]): void;
    public removeEdge(source: TCommonModel, targets: string | string[], modelName: keyof IModelMap): void;
    public removeEdge(source: TCommonModel, filter: (uid: string) => bool, modelName: keyof IModelMap): void;
    public removeEdge(
        source: TCommonModel,
        targets: TCommonModel | TCommonModel[] | string | string[] | ((uid: string) => bool),
        modelName?: keyof IModelMap
    ) {
        const sourceModelName = this.#convertModelName(source.MODEL_NAME);
        const targetMap = Utils.Object.getDeepRecordMap(false, this.#edgeMap, sourceModelName, source.uid);
        if (!targetMap) {
            return;
        }

        modelName = modelName ? this.#convertModelName(modelName) : undefined;

        if (Utils.Type.isFunction(targets)) {
            if (!modelName || !targetMap[modelName]) {
                return;
            }

            const filter = targets;
            const children = targetMap[modelName]!;
            Array.from(children).forEach((uid) => {
                if (!filter(uid)) {
                    return;
                }

                children.delete(uid);
                notifyModelEdge({
                    subscriptions: this.#subscriptions,
                    convertModelName: this.#convertModelName,
                    context: {
                        event: "DISCONNECTED",
                        source,
                        target: { modelName, uid },
                    },
                });
            });
            return;
        }

        if (!Utils.Type.isArray(targets)) {
            targets = [targets as TCommonModel];
        }

        if (modelName) {
            if (!targetMap[modelName]) {
                return;
            }

            const children = targetMap[modelName]!;
            for (let i = 0; i < targets.length; ++i) {
                const target = targets[i];
                const targetUID = Utils.Type.isString(target) ? target : target.uid;
                children.delete(targetUID);
                notifyModelEdge({
                    subscriptions: this.#subscriptions,
                    convertModelName: this.#convertModelName,
                    context: {
                        event: "DISCONNECTED",
                        source,
                        target: { modelName, uid: targetUID },
                    },
                });
            }
            return;
        }

        for (let i = 0; i < targets.length; ++i) {
            const target = targets[i];
            if (Utils.Type.isString(target)) {
                continue;
            }

            const targetModelName = this.#convertModelName(target.MODEL_NAME);
            if (!targetMap[targetModelName]) {
                continue;
            }

            const children = targetMap[targetModelName];
            children.delete(target.uid);
            notifyModelEdge({
                subscriptions: this.#subscriptions,
                convertModelName: this.#convertModelName,
                context: {
                    event: "DISCONNECTED",
                    source,
                    target: { modelName: targetModelName, uid: target.uid },
                },
            });
        }
    }

    public subscribe(context: TConnectedSubscribeContext): () => void;
    public subscribe(context: TDisconnectedSubscribeContext): () => void;
    public subscribe(context: TSubscribeContext): () => void {
        return subscribeModelEdge({
            subscriptions: this.#subscriptions,
            convertModelName: this.#convertModelName,
            context,
        });
    }

    public unsubscribe(context: TConnectedSubscriptionContext): void;
    public unsubscribe(context: TDisconnectedSubscriptionContext): void;
    public unsubscribe(context: TSubscriptionContext): void {
        unsubscribeModelEdge({
            subscriptions: this.#subscriptions,
            convertModelName: this.#convertModelName,
            context,
        });
    }

    public useModels<TTargetClass extends TPickedModelClass<keyof IModelMap>>(
        source: TCommonModel,
        targetClass: TTargetClass,
        deps?: React.DependencyList
    ): InstanceType<TTargetClass>[] {
        const store = this as _ModelEdgeStore;
        const [updated, forceUpdate] = useReducer((x) => x + 1, 0);
        const models = useMemo(() => this.getModels(source, targetClass), [source, targetClass, updated]);
        const sourceModelName = store.#convertModelName(source.MODEL_NAME);
        const targetModelName = store.#convertModelName(targetClass.MODEL_NAME);

        useEffect(() => {
            const unsubs: (() => void)[] = models
                .map((model) => {
                    const key = `${sourceModelName}-${source.uid}-${targetModelName}-${model.uid}-${Utils.String.Token.uuid()}`;
                    const unsub = store.subscribe({
                        event: "DISCONNECTED",
                        key,
                        source,
                        target: model,
                        callback: () => {
                            forceUpdate();
                            unsub();
                        },
                    });
                    return unsub;
                })
                .concat(
                    store.subscribe({
                        event: "CONNECTED",
                        key: `${sourceModelName}-${source.uid}-${targetModelName}-${Utils.String.Token.uuid()}`,
                        targetClass,
                        source,
                        callback: (uids: string[]) => {
                            if (!uids.length) {
                                return;
                            }

                            forceUpdate();
                        },
                    })
                );

            return () => {
                for (let i = 0; i < unsubs.length; ++i) {
                    unsubs[i]();
                }

                unsubs.splice(0);
            };
        }, [source, models, forceUpdate, ...(deps || [])]);

        return models;
    }

    public getModels<TTargetClass extends TPickedModelClass<keyof IModelMap>>(
        source: TCommonModel,
        targetClass: TTargetClass
    ): InstanceType<TTargetClass>[] {
        const store = this as _ModelEdgeStore;
        const sourceModelName = store.#convertModelName(source.MODEL_NAME);
        const targetModelName = store.#convertModelName(targetClass.MODEL_NAME);
        return targetClass.getModels(
            Array.from(store.#edgeMap[sourceModelName]?.[source.uid]?.[targetModelName] ?? [])
        ) as InstanceType<TTargetClass>[];
    }

    public useModel<TTargetClass extends TPickedModelClass<keyof IModelMap>>(
        source: TCommonModel,
        targetClass: TTargetClass,
        targetUID: string,
        deps?: React.DependencyList
    ): InstanceType<TTargetClass> | undefined {
        const store = this as _ModelEdgeStore;
        const [model, setModel] = useState<InstanceType<TTargetClass> | undefined>(
            targetClass.getModel(targetUID) as InstanceType<TTargetClass> | undefined
        );
        const sourceModelName = store.#convertModelName(source.MODEL_NAME);
        const targetModelName = store.#convertModelName(targetClass.MODEL_NAME);

        useEffect(() => {
            if (!model) {
                return;
            }

            const key = `${sourceModelName}-${source.uid}-${targetModelName}-${model.uid}-${Utils.String.Token.uuid()}`;
            const unsub = store.subscribe({
                event: "DISCONNECTED",
                key,
                source,
                target: model,
                callback: () => {
                    setModel(undefined);
                    unsub();
                },
            });

            return () => {
                unsub();
            };
        }, [source, model, ...(deps || [])]);

        return model;
    }

    #convertModelName = (name: keyof IModelMap): keyof IModelMap => {
        if (name === "AuthUser") {
            return "User";
        }
        return name;
    };
}

const ModelEdgeStore = new _ModelEdgeStore();

export default ModelEdgeStore;
