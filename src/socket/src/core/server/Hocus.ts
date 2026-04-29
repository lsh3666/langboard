import { Hocuspocus } from "@hocuspocus/server";
import Auth from "@/core/security/Auth";
import EditorSyncStorage from "@/core/server/EditorSyncStorage";
import ISocketClient from "@/core/server/ISocketClient";
import Subscription from "@/core/server/Subscription";
import User from "@/models/User";
import { ESocketTopic } from "@langboard/core/enums";
import { EEditorCollaborationType } from "@langboard/core/constants";
import * as Y from "yjs";

interface IHocusDocumentAccess {
    topic: ESocketTopic;
    topicId: string;
}

interface IHocusDocumentName {
    entityId: string;
    sectionName: string | null;
    type: string;
}

const createPermissionDeniedError = (reason: string) => {
    return Object.assign(new Error(reason), { reason });
};

const createValidatorClient = (user: User): ISocketClient => {
    return {
        get user() {
            return user;
        },
        subscribe: async () => {},
        unsubscribe: async () => {},
        send: () => {},
        onClose: () => {},
    };
};

const getAuthenticatedUser = async ({
    context,
    requestParameters,
    token,
}: {
    context: Record<string, unknown>;
    requestParameters: URLSearchParams;
    token: string;
}) => {
    if (context.user) {
        return context.user as User;
    }

    const parameters = new URLSearchParams(requestParameters);
    if (token) {
        parameters.set("authorization", token);
    }

    return await Auth.validateToken("socket", parameters);
};

const parseDocumentName = (documentName: string): IHocusDocumentName | null => {
    const parts = documentName.split(":") as [string, string?, string?, ...string[]];
    const [type, entityId, sectionName, ...extraParts] = parts;
    if (!type || !entityId || extraParts.length > 0) {
        return null;
    }

    return {
        entityId,
        sectionName: sectionName ?? null,
        type,
    };
};

const getDocumentAccess = (documentName: string): IHocusDocumentAccess | null => {
    const parsed = parseDocumentName(documentName);
    if (!parsed) {
        return null;
    }

    switch (parsed.type) {
        case EEditorCollaborationType.Card:
        case EEditorCollaborationType.CardTitle:
        case EEditorCollaborationType.CardDescription:
        case EEditorCollaborationType.CardNewComment:
        case EEditorCollaborationType.CardComment:
            return { topic: ESocketTopic.BoardCard, topicId: parsed.entityId };
        case EEditorCollaborationType.BoardColumnName:
            return { topic: ESocketTopic.Board, topicId: parsed.entityId };
        case EEditorCollaborationType.BoardSettings:
            return { topic: ESocketTopic.BoardSettings, topicId: parsed.entityId };
        case EEditorCollaborationType.Wiki:
        case EEditorCollaborationType.WikiTitle:
        case EEditorCollaborationType.WikiContent:
            return { topic: ESocketTopic.BoardWikiPrivate, topicId: parsed.entityId };
        default:
            return null;
    }
};

const Hocus = new Hocuspocus({
    async onAuthenticate({ context, documentName, requestParameters, token }) {
        const user = await getAuthenticatedUser({ context, requestParameters, token });
        if (!user) {
            throw createPermissionDeniedError("unauthorized");
        }

        const access = getDocumentAccess(documentName);
        if (!access) {
            throw createPermissionDeniedError("invalid-document");
        }

        const isAllowed = await Subscription.validate(access.topic, {
            client: createValidatorClient(user),
            topicId: access.topicId,
        });
        if (!isAllowed) {
            throw createPermissionDeniedError("permission-denied");
        }

        return { user };
    },
    async onLoadDocument({ documentName, document }) {
        const state = await EditorSyncStorage.load(documentName);
        if (!state) {
            return;
        }

        Y.applyUpdate(document, state);
    },
    async onStoreDocument({ documentName, document }) {
        await EditorSyncStorage.save(documentName, Y.encodeStateAsUpdate(document));
    },
});

export default Hocus;
