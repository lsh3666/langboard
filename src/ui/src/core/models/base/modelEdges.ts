/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { Utils } from "@langboard/core/utils";
import { IModelMap, ModelRegistry, TPickedModel } from "@/core/models/ModelRegistry";
import ModelEdgeStore from "@/core/models/ModelEdgeStore";
import type { IBaseModel } from "@/core/models/Base";

type TCommonModel = TPickedModel<keyof IModelMap>;
type TForeignModelsMap = Partial<Record<string, keyof IModelMap>>;

export const pickForeignModels = (model: Record<string, any>, foreignModels: TForeignModelsMap) => {
    const pickedForeignModels: Record<string, any> = {};

    Object.keys(foreignModels).forEach((key) => {
        if (!model[key]) {
            return;
        }

        pickedForeignModels[key] = model[key];
    });

    return pickedForeignModels;
};

export const useForeignModelArray = <TTargetModel extends TCommonModel>(
    source: TCommonModel,
    modelName: keyof IModelMap,
    dependencies?: React.DependencyList
) => {
    return ModelEdgeStore.useModels(source as any, ModelRegistry[modelName].Model, dependencies) as TTargetModel[];
};

export const useForeignModelOne = <TTargetModel extends TCommonModel>(
    source: TCommonModel,
    modelName: keyof IModelMap,
    dependencies?: React.DependencyList
) => {
    const models = ModelEdgeStore.useModels(source as any, ModelRegistry[modelName].Model, dependencies);
    const [fieldValue, setFieldValue] = useState(models[0] || null);

    useEffect(() => {
        setFieldValue(models[0] || null);
    }, [models]);

    return fieldValue as TTargetModel;
};

export const getForeignModelArray = <TTargetModel extends TCommonModel>(source: TCommonModel, modelName: keyof IModelMap) => {
    return ModelEdgeStore.getModels(source as any, ModelRegistry[modelName].Model) as TTargetModel[];
};

export const syncForeignModelEdges = ({
    source,
    model,
    foreignModels,
    isModelInstance,
}: {
    source: TCommonModel;
    model: Record<string, any>;
    foreignModels: TForeignModelsMap;
    isModelInstance: (value: unknown) => value is TCommonModel;
}) => {
    Object.keys(foreignModels).forEach((key) => {
        if (!model[key]) {
            return;
        }

        const modelName = foreignModels[key];
        if (!modelName) {
            return;
        }

        if (!Utils.Type.isArray(model[key])) {
            model[key] = [model[key]];
        }

        const oldModels = ModelEdgeStore.getModels(source as any, ModelRegistry[modelName].Model);
        ModelEdgeStore.removeEdge(source as any, oldModels);

        const foreignValues = model[key] as (TCommonModel | IBaseModel)[];
        const rawModels = foreignValues.filter((subModel) => !isModelInstance(subModel));
        const models = ModelRegistry[modelName].Model.fromArray(rawModels as any);
        const existingModels = foreignValues.filter(isModelInstance);

        ModelEdgeStore.addEdge(source as any, [...existingModels, ...models]);

        delete model[key];
    });
};
