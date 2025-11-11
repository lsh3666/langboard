import { BaseModel } from "@/core/models/Base";
import { registerModel } from "@/core/models/ModelRegistry";
import { Utils } from "@langboard/core/utils";
import useBotUpdatedHandlers from "@/controllers/socket/global/useBotUpdatedHandlers";
import useBotDeletedHandlers from "@/controllers/socket/global/useBotDeletedHandlers";
import useBotSettingUpdatedHandlers from "@/controllers/socket/settings/bots/useBotSettingUpdatedHandlers";
import { EBotPlatform, EBotPlatformRunningType } from "@langboard/core/ai";
import { IBaseBotModel } from "@/core/models/bot.related.type";

export const ALLOWED_ALL_IPS = "*";

export interface Interface extends IBaseBotModel {
    name: string;
    bot_uname: string;
    avatar?: string;
    api_url: string;
    api_key: string;
    app_api_token: string;
    ip_whitelist: string[];
    value: string;
}

class BotModel extends BaseModel<Interface> {
    public static get MODEL_NAME() {
        return "BotModel" as const;
    }

    public static get BOT_UNAME_PREFIX() {
        return "bot-";
    }

    constructor(model: Record<string, unknown>) {
        super(model);

        this.subscribeSocketEvents([useBotUpdatedHandlers, useBotSettingUpdatedHandlers, useBotDeletedHandlers], {
            bot: this,
        });
    }

    public static convertModel(model: Interface): Interface {
        if (model.avatar) {
            model.avatar = Utils.String.convertServerFileURL(model.avatar);
        }

        if (Utils.Type.isString(model.platform)) {
            model.platform = Utils.String.convertSafeEnum(EBotPlatform, model.platform);
        }

        if (Utils.Type.isString(model.platform_running_type)) {
            model.platform_running_type = Utils.String.convertSafeEnum(EBotPlatformRunningType, model.platform_running_type);
        }

        return model;
    }

    public get name() {
        return this.getValue("name");
    }
    public set name(value) {
        this.update({ name: value });
    }

    public get bot_uname() {
        return this.getValue("bot_uname");
    }
    public set bot_uname(value) {
        this.update({ bot_uname: value });
    }

    public get avatar() {
        return this.getValue("avatar");
    }
    public set avatar(value) {
        this.update({ avatar: value });
    }

    public get platform() {
        return this.getValue("platform");
    }
    public set platform(value) {
        this.update({ platform: value });
    }

    public get platform_running_type() {
        return this.getValue("platform_running_type");
    }
    public set platform_running_type(value) {
        this.update({ platform_running_type: value });
    }

    public get api_url() {
        return this.getValue("api_url");
    }
    public set api_url(value) {
        this.update({ api_url: value });
    }

    public get api_key() {
        return this.getValue("api_key");
    }
    public set api_key(value) {
        this.update({ api_key: value });
    }

    public get app_api_token() {
        return this.getValue("app_api_token");
    }
    public set app_api_token(value) {
        this.update({ app_api_token: value });
    }

    public get ip_whitelist() {
        return this.getValue("ip_whitelist");
    }
    public set ip_whitelist(value) {
        this.update({ ip_whitelist: value });
    }

    public get value() {
        return this.getValue("value");
    }
    public set value(value) {
        this.update({ value });
    }
}

registerModel(BotModel);

export const Model = BotModel;
export type TModel = BotModel;
