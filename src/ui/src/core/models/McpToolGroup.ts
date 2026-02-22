import useMcpToolGroupDeletedHandlers from "@/controllers/socket/settings/mcpToolGroups/useMcpToolGroupDeletedHandlers";
import useMcpToolGroupUpdatedHandlers from "@/controllers/socket/settings/mcpToolGroups/useMcpToolGroupUpdatedHandlers";
import { BaseModel, IBaseModel } from "@/core/models/Base";
import { registerModel } from "@/core/models/ModelRegistry";
import { Utils } from "@langboard/core/utils";

export type TGroupType = "admin" | "global";

export interface Interface extends IBaseModel {
    user_uid?: string;
    name: string;
    description: string;
    tools: string[];
    activated_at?: Date;
}

class McpToolGroup extends BaseModel<Interface> {
    public static get MODEL_NAME() {
        return "McpToolGroup" as const;
    }

    constructor(model: Record<string, unknown>) {
        super(model);

        this.subscribeSocketEvents([useMcpToolGroupUpdatedHandlers, useMcpToolGroupDeletedHandlers], {
            toolGroup: this,
        });
    }

    public static convertModel(model: Interface): Interface {
        if (Utils.Type.isString(model.activated_at)) {
            model.activated_at = new Date(model.activated_at);
        }
        return model;
    }

    public get user_uid() {
        return this.getValue("user_uid");
    }
    public set user_uid(value) {
        this.update({ user_uid: value });
    }

    public get name() {
        return this.getValue("name");
    }
    public set name(value) {
        this.update({ name: value });
    }

    public get description() {
        return this.getValue("description");
    }
    public set description(value) {
        this.update({ description: value });
    }

    public get tools() {
        return this.getValue("tools");
    }
    public set tools(value) {
        this.update({ tools: value });
    }

    public get activated_at(): Date | undefined {
        return this.getValue("activated_at");
    }
    public set activated_at(value: string | Date | undefined) {
        this.update({ activated_at: value as unknown as Date });
    }

    public get is_active() {
        return this.activated_at !== null;
    }
}

registerModel(McpToolGroup);

export const Model = McpToolGroup;
export type TModel = McpToolGroup;
