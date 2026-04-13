import { Hocuspocus } from "@hocuspocus/server";
import Auth from "@/core/security/Auth";
import EditorSyncStorage from "@/core/server/EditorSyncStorage";
import ISocketClient from "@/core/server/ISocketClient";
import Subscription from "@/core/server/Subscription";
import User from "@/models/User";
import { ESocketTopic } from "@langboard/core/enums";
import { EEditorCollaborationType } from "@langboard/core/constants";
import type { TEditorCollaborationType } from "@langboard/core/constants";
import * as Y from "yjs";

interface IHocusDocumentAccess {
    topic: ESocketTopic;
    topicId: string;
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

const getDocumentAccess = (documentName: string): IHocusDocumentAccess | null => {
    const [type, ...ids] = documentName.split(":") as [TEditorCollaborationType, ...string[]];

    switch (type) {
        case EEditorCollaborationType.Card:
        case EEditorCollaborationType.CardDescription:
        case EEditorCollaborationType.CardNewComment:
            return ids[0] ? { topic: ESocketTopic.BoardCard, topicId: ids[0] } : null;
        case EEditorCollaborationType.CardComment:
            return ids[0] ? { topic: ESocketTopic.BoardCard, topicId: ids[0] } : null;
        case EEditorCollaborationType.Wiki:
        case EEditorCollaborationType.WikiContent:
            return ids[0] ? { topic: ESocketTopic.BoardWikiPrivate, topicId: ids[0] } : null;
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
