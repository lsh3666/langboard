import * as AuthUser from "@/core/models/AuthUser";
import * as User from "@/core/models/User";
import { BaseModel, IBaseModel, IEditorContent } from "@/core/models/Base";
import { registerModel } from "@/core/models/ModelRegistry";
import useBoardWikiPublicChangedHandlers from "@/controllers/socket/wiki/useBoardWikiPublicChangedHandlers";
import useBoardWikiDetailsChangedHandlers from "@/controllers/socket/wiki/useBoardWikiDetailsChangedHandlers";
import useBoardWikiAssigneesUpdatedHandlers from "@/controllers/socket/wiki/useBoardWikiAssigneesUpdatedHandlers";
import { useSocketOutsideProvider } from "@/core/providers/SocketProvider";
import useMetadataUpdatedHandlers from "@/controllers/socket/metadata/useMetadataUpdatedHandlers";
import useMetadataDeletedHandlers from "@/controllers/socket/metadata/useMetadataDeletedHandlers";
import { ESocketTopic } from "@langboard/core/enums";

export interface Interface extends IBaseModel {
    project_uid: string;
    title: string;
    content?: IEditorContent;
    order: number;
    is_public: bool;
    forbidden: bool;
}

export interface IStore extends Interface {
    assigned_members: User.Interface[];

    // variable set from the client side
    isInBin: bool;
}

class ProjectWiki extends BaseModel<IStore> {
    public static override get FOREIGN_MODELS() {
        return {
            assigned_members: User.Model.MODEL_NAME,
        };
    }
    override get FOREIGN_MODELS() {
        return ProjectWiki.FOREIGN_MODELS;
    }
    public static get MODEL_NAME() {
        return "ProjectWiki" as const;
    }
    #isSubscribedOnce = false;

    constructor(model: Record<string, unknown>) {
        super(model);

        // Public handlers
        this.subscribeSocketEvents([useBoardWikiDetailsChangedHandlers], {
            projectUID: this.project_uid,
            wiki: this,
            isPrivate: false,
        });
    }

    public static createFakeMethodsMap<TMethodMap>(model: IStore): TMethodMap {
        const map = {
            changeToPrivate: () => {
                model.title = "";
                model.content = undefined;
                model.is_public = false;
                model.forbidden = true;
            },
        };
        return map as TMethodMap;
    }

    public subscribePrivateSocketHandlers(currentUser: AuthUser.TModel) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handlers: any = [useBoardWikiDetailsChangedHandlers];
        if (!this.#isSubscribedOnce) {
            handlers.push(useBoardWikiPublicChangedHandlers, useBoardWikiAssigneesUpdatedHandlers);
            this.#isSubscribedOnce = true;
        }

        const unsub = this.subscribeSocketEvents(handlers, {
            projectUID: this.project_uid,
            wiki: this,
            currentUser,
            isPrivate: true,
        });

        const unsubMetadata = this.subscribeSocketEvents([useMetadataUpdatedHandlers, useMetadataDeletedHandlers], {
            type: "project_wiki",
            uid: this.uid,
        });

        return () => {
            this.#isSubscribedOnce = false;
            unsub();
            unsubMetadata();
        };
    }

    public get project_uid() {
        return this.getValue("project_uid");
    }
    public set project_uid(value) {
        this.update({ project_uid: value });
    }

    public get title() {
        return this.getValue("title");
    }
    public set title(value) {
        this.update({ title: value });
    }

    public get content() {
        return this.getValue("content");
    }
    public set content(value) {
        this.update({ content: value });
    }

    public get order() {
        return this.getValue("order");
    }
    public set order(value) {
        this.update({ order: value });
    }

    public get is_public() {
        return this.getValue("is_public");
    }
    public set is_public(value) {
        this.update({ is_public: value });
    }

    public get assigned_members(): User.TModel[] {
        return this.getForeignValue("assigned_members");
    }
    public set assigned_members(value: (User.TModel | User.Interface)[]) {
        this.update({ assigned_members: value });
    }

    public get forbidden() {
        return this.getValue("forbidden");
    }
    public set forbidden(value) {
        this.update({ forbidden: value });
    }

    public get isInBin() {
        return this.getValue("isInBin") ?? false;
    }
    public set isInBin(value) {
        this.update({ isInBin: value });
    }

    public changeToPrivate() {
        const socket = useSocketOutsideProvider();
        socket.unsubscribe(ESocketTopic.BoardWikiPrivate, [this.uid]);

        this.title = "";
        this.content = undefined;
        this.is_public = false;
        this.forbidden = true;
    }
}

registerModel(ProjectWiki);

export type TModel = ProjectWiki;
export const Model = ProjectWiki;
