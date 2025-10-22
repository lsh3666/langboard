/* eslint-disable @typescript-eslint/no-explicit-any */
import useAppSettingDeletedHandlers from "@/controllers/socket/settings/useAppSettingDeletedHandlers";
import useAppSettingUpdatedHandlers from "@/controllers/socket/settings/useAppSettingUpdatedHandlers";
import { BaseModel, IBaseModel } from "@/core/models/Base";
import { Utils } from "@langboard/core/utils";
import { registerModel } from "@/core/models/ModelRegistry";

export enum ESettingType {
    ApiKey = "api_key",
    WebhookUrl = "webhook_url",
}

export interface Interface extends IBaseModel {
    setting_type: ESettingType;
    setting_name: string;
    setting_value: any;
    last_used_at: Date;
    total_used_count: number;
}

class AppSettingModel extends BaseModel<Interface> {
    public static get MODEL_NAME() {
        return "AppSettingModel" as const;
    }

    constructor(model: Record<string, unknown>) {
        super(model);

        this.subscribeSocketEvents([useAppSettingUpdatedHandlers, useAppSettingDeletedHandlers], {
            setting: this,
        });
    }

    public static convertModel(model: Interface): Interface {
        if (model.setting_type) {
            if (Utils.Type.isString(model.setting_type)) {
                model.setting_type = Utils.String.convertSafeEnum(ESettingType, model.setting_type);
            }
        }
        if (Utils.Type.isString(model.last_used_at)) {
            model.last_used_at = new Date(model.last_used_at);
        }
        return model;
    }

    public get setting_type() {
        return this.getValue("setting_type");
    }
    public set setting_type(value) {
        this.update({ setting_type: value });
    }

    public get setting_name() {
        return this.getValue("setting_name");
    }
    public set setting_name(value) {
        this.update({ setting_name: value });
    }

    public get setting_value() {
        return this.getValue("setting_value");
    }
    public set setting_value(value) {
        this.update({ setting_value: value });
    }

    public get last_used_at(): Date {
        return this.getValue("last_used_at");
    }
    public set last_used_at(value: string | Date) {
        this.update({ last_used_at: new Date(value) });
    }

    public get total_used_count() {
        return this.getValue("total_used_count");
    }
    public set total_used_count(value) {
        this.update({ total_used_count: value });
    }
}

registerModel(AppSettingModel);

export const Model = AppSettingModel;
export type TModel = AppSettingModel;
