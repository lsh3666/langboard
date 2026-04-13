import { YjsPlugin } from "@platejs/yjs/react";
import { RemoteCursorOverlay } from "@/components/plate-ui/remote-cursor-overlay";
import { ISocketContext } from "@/core/providers/SocketProvider";
import { Utils } from "@langboard/core/utils";

export interface ICreateYjsKit {
    socket: ISocketContext;
    userName: string;
    documentID: string;
}

export const createYjsKit = ({ socket, userName, documentID }: ICreateYjsKit) => {
    const url = socket.getAuthorizedWebSocketUrl("editor-sync");
    if (!url) {
        return null;
    }

    return YjsPlugin.configure({
        render: {
            afterEditable: RemoteCursorOverlay,
        },
        options: {
            cursors: {
                data: {
                    name: userName,
                    color: new Utils.Color.Generator(userName).generateRandomColor(),
                },
            },
            providers: [
                {
                    type: "hocuspocus",
                    options: {
                        name: documentID,
                        url,
                    },
                },
            ],
        },
    });
};
