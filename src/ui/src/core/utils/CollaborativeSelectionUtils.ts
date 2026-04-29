import { TUserLikeModel } from "@/core/models/ModelRegistry";
import { Utils } from "@langboard/core/utils";

export const parseCollaborativeStringList = (value: string, fallback: string[]) => {
    try {
        const parsed = JSON.parse(value);
        if (!Array.isArray(parsed) || parsed.some((item) => !Utils.Type.isString(item))) {
            return fallback;
        }

        return parsed;
    } catch {
        return fallback;
    }
};

export const parseCollaborativeMemberUIDs = (value: string, fallback: string[]) => {
    return parseCollaborativeStringList(value, fallback).map((item) => (item.startsWith("member:") ? item.slice("member:".length) : item));
};

export const getUserUIDs = (users: (string | TUserLikeModel)[]) => {
    return users
        .map((user) => (Utils.Type.isString(user) ? "" : user?.uid))
        .filter((uid): uid is string => Utils.Type.isString(uid) && uid.length > 0);
};

export const getInviteEmails = (items: (string | TUserLikeModel)[]) => {
    return items.filter((item): item is string => Utils.Type.isString(item));
};

const createMemberToken = (uid: string) => `member:${uid}`;
const createEmailToken = (email: string) => `email:${email}`;

const getSelectableEmail = (item: TUserLikeModel) => {
    const email = (item as { email?: unknown }).email;
    return Utils.Type.isString(email) ? email : "";
};

export const serializeBoardMemberItems = (items: (string | TUserLikeModel)[]) => {
    return JSON.stringify(
        items.flatMap((item) => {
            if (Utils.Type.isString(item)) {
                return [createEmailToken(item)];
            }

            return item.uid ? [createMemberToken(item.uid)] : [];
        })
    );
};

export const parseBoardMemberItems = (value: string, fallback: (string | TUserLikeModel)[], allSelectables: TUserLikeModel[]) => {
    try {
        const parsed = JSON.parse(value);
        if (!Array.isArray(parsed) || parsed.some((item) => !Utils.Type.isString(item))) {
            return fallback;
        }

        return parsed.flatMap((item) => {
            if (item.startsWith("member:")) {
                const uid = item.slice("member:".length);
                const selectable = allSelectables.find((candidate) => candidate.uid === uid);
                return selectable ? [selectable] : [];
            }

            if (item.startsWith("email:")) {
                const email = item.slice("email:".length);
                const normalizedEmail = email.toLowerCase();
                const selectable = allSelectables.find((candidate) => getSelectableEmail(candidate).toLowerCase() === normalizedEmail);
                return selectable ? [selectable] : [email];
            }

            return [];
        });
    } catch {
        return fallback;
    }
};

export const isAssignableWikiMember = (item: TUserLikeModel, currentUserUID: string) => {
    return item.uid !== currentUserUID && !("is_admin" in item && item.is_admin);
};
