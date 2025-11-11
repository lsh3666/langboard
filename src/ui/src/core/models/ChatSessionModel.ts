import { BaseModel, IBaseModel } from "@/core/models/Base";
import { registerModel } from "@/core/models/ModelRegistry";
import { Utils } from "@langboard/core/utils";

export interface Interface extends IBaseModel {
    filterable_table: "project";
    filterable_uid: string;
    user_uid: string;
    title: string;
    last_messaged_at?: Date;
}

class ChatSessionModel extends BaseModel<Interface> {
    public static get MODEL_NAME() {
        return "ChatSessionModel" as const;
    }

    public static convertModel(model: Interface): Interface {
        if (Utils.Type.isString(model.last_messaged_at)) {
            model.last_messaged_at = new Date(model.last_messaged_at);
        }
        return model;
    }

    public get filterable_table() {
        return this.getValue("filterable_table");
    }
    public set filterable_table(value) {
        this.update({ filterable_table: value });
    }

    public get filterable_uid() {
        return this.getValue("filterable_uid");
    }
    public set filterable_uid(value) {
        this.update({ filterable_uid: value });
    }

    public get user_uid() {
        return this.getValue("user_uid");
    }
    public set user_uid(value) {
        this.update({ user_uid: value });
    }

    public get title() {
        return this.getValue("title") || "Untitled Session";
    }
    public set title(value) {
        this.update({ title: value });
    }

    public get last_messaged_at(): Date | undefined {
        return this.getValue("last_messaged_at");
    }
    public set last_messaged_at(value: string | Date | undefined) {
        this.update({ last_messaged_at: value as unknown as Date });
    }
}

registerModel(ChatSessionModel);

export const Model = ChatSessionModel;
export type TModel = ChatSessionModel;
