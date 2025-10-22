import useUserUpdatedHandlers from "@/controllers/socket/user/useUserUpdatedHandlers";
import { BaseModel, IBaseModel } from "@/core/models/Base";
import { registerModel } from "@/core/models/ModelRegistry";
import createFakeModel from "@/core/models/FakeModel";
import { useSocketOutsideProvider } from "@/core/providers/SocketProvider";
import { Utils } from "@langboard/core/utils";
import { ESocketTopic } from "@langboard/core/enums";
import useUserDeletedHandlers from "@/controllers/socket/user/useUserDeletedHandlers";

export interface Interface extends IBaseModel {
    type: "user" | "unknown" | "bot" | "group_email";
    firstname: string;
    lastname: string;
    email: string;
    username: string;
    avatar?: string;

    // In settings
    is_admin?: bool;
    industry: string;
    purpose: string;
    affiliation?: string;
    position?: string;
    activated_at?: Date;
}

export const INDUSTRIES: string[] = ["Industry 1"];
export const PURPOSES: string[] = ["Purpose 1"];

class User<TInherit extends Interface = Interface> extends BaseModel<TInherit & Interface> {
    static readonly #pendingSubscribers: string[] = [];
    static readonly #subscribedUserUIDs: string[] = [];
    static #subscribeTimeout: NodeJS.Timeout | undefined = undefined;

    public static get USER_TYPE() {
        return "user" as const;
    }
    public static get UNKNOWN_TYPE() {
        return "unknown" as const;
    }
    public static get GROUP_EMAIL_TYPE() {
        return "group_email" as const;
    }

    public static get MODEL_NAME() {
        return "User" as const;
    }

    constructor(model: Record<string, unknown>) {
        super(model);

        this.#subscribeUser();
    }

    public static createUnknownUser(): User {
        const model = {
            type: User.UNKNOWN_TYPE,
            uid: "0",
            firstname: "",
            lastname: "",
            email: "",
            username: "",
            avatar: undefined,
            created_at: undefined!,
            updated_at: undefined!,
            activated_at: undefined,
            is_admin: undefined,
            industry: "",
            purpose: "",
            affiliation: undefined,
            position: undefined,
        };

        return createFakeModel(User.MODEL_NAME, model, User.createFakeMethodsMap(model));
    }

    public static createTempEmailUser(email: string): User {
        const model = {
            type: User.GROUP_EMAIL_TYPE,
            uid: "0",
            firstname: email,
            lastname: "",
            email,
            username: "",
            avatar: undefined,
            created_at: undefined!,
            updated_at: undefined!,
            activated_at: undefined,
            is_admin: undefined,
            industry: "",
            purpose: "",
            affiliation: undefined,
            position: undefined,
        };

        return createFakeModel(User.MODEL_NAME, model, User.createFakeMethodsMap(model));
    }

    public static createFakeUser(model: Interface): User {
        return createFakeModel(User.MODEL_NAME, model, User.createFakeMethodsMap(model));
    }

    public static convertModel(model: Interface): Interface {
        if (model.avatar) {
            model.avatar = Utils.String.convertServerFileURL(model.avatar);
        }
        if (Utils.Type.isString(model.activated_at)) {
            model.activated_at = new Date(model.activated_at);
        }
        return model;
    }

    public static createFakeMethodsMap<TMethodMap>(model: Interface): TMethodMap {
        const map = {
            isPresentableUnknownUser: () => model.type === User.GROUP_EMAIL_TYPE,
            isValidUser: () => Utils.Type.isString(model.uid) && !map.isPresentableUnknownUser(),
            isDeletedUser: () => model.type === User.UNKNOWN_TYPE,
        };
        return map as TMethodMap;
    }

    public setDeleted() {
        this.update({
            type: User.UNKNOWN_TYPE,
            firstname: "",
            lastname: "",
            email: "",
            username: "",
            avatar: undefined,
            activated_at: undefined,
            is_admin: undefined,
            industry: "",
            purpose: "",
            affiliation: undefined,
            position: undefined,
        });
    }

    public get type() {
        return this.getValue("type");
    }
    public set type(value) {
        this.update({ type: value });
    }

    public get firstname() {
        return this.getValue("firstname");
    }
    public set firstname(value) {
        this.update({ firstname: value });
    }

    public get lastname() {
        return this.getValue("lastname");
    }
    public set lastname(value) {
        this.update({ lastname: value });
    }

    public get email() {
        return this.getValue("email");
    }
    public set email(value) {
        this.update({ email: value });
    }

    public get username() {
        return this.getValue("username");
    }
    public set username(value) {
        this.update({ username: value });
    }

    public get avatar() {
        return this.getValue("avatar");
    }
    public set avatar(value) {
        this.update({ avatar: value });
    }

    public get is_admin() {
        return this.getValue("is_admin");
    }
    public set is_admin(value) {
        this.update({ is_admin: value });
    }

    public get industry() {
        return this.getValue("industry");
    }
    public set industry(value) {
        this.update({ industry: value });
    }

    public get purpose() {
        return this.getValue("purpose");
    }
    public set purpose(value) {
        this.update({ purpose: value });
    }

    public get affiliation() {
        return this.getValue("affiliation");
    }
    public set affiliation(value) {
        this.update({ affiliation: value });
    }

    public get position() {
        return this.getValue("position");
    }
    public set position(value) {
        this.update({ position: value });
    }

    public get activated_at(): Date | undefined {
        return this.getValue("activated_at");
    }
    public set activated_at(value: string | Date | undefined) {
        this.update({ activated_at: Utils.Type.isString(value) ? new Date(value) : value });
    }

    public isPresentableUnknownUser(type?: User["type"]) {
        if (!type) {
            type = this.type;
        }
        return type === User.GROUP_EMAIL_TYPE;
    }

    public isValidUser() {
        return Utils.Type.isString(this.uid) && !this.isPresentableUnknownUser();
    }

    public isDeletedUser(type?: User["type"]) {
        if (!type) {
            type = this.type;
        }
        return type === User.UNKNOWN_TYPE;
    }

    #subscribeUser() {
        if (!this.isValidUser() || User.#pendingSubscribers.includes(this.uid) || User.#subscribedUserUIDs.includes(this.uid)) {
            return;
        }

        if (User.#subscribeTimeout) {
            clearTimeout(User.#subscribeTimeout);
            User.#subscribeTimeout = undefined;
        }

        User.#pendingSubscribers.push(this.uid);

        User.#subscribeTimeout = setTimeout(() => {
            const socket = useSocketOutsideProvider();
            const userUIDs = User.#pendingSubscribers.splice(0);
            User.#subscribedUserUIDs.push(...userUIDs);

            socket.subscribe(ESocketTopic.User, userUIDs);

            for (let i = 0; i < userUIDs.length; ++i) {
                const uid = userUIDs[i];
                User.subscribe("DELETION", uid, (uids) => {
                    if (uids.includes(uid)) {
                        socket.unsubscribe(ESocketTopic.User, [uid]);
                    }
                });
            }
        }, 100);

        this.subscribeSocketEvents([useUserUpdatedHandlers, useUserDeletedHandlers], {
            user: this,
        });
    }
}

registerModel(User);

export type TModel = User;
export const Model = User;

export const filterValidUserUIDs = (users: User[]): string[] => {
    return users.filter((user) => user.isValidUser()).map((user) => user.uid);
};
