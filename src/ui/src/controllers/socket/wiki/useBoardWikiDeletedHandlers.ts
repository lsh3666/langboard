import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectWiki } from "@/core/models";
import { ESocketTopic } from "@langboard/core/enums";

export interface IUseBoardWikiDeletedResponse {
    uid: string;
}

export interface IUseBoardWikiDeletedHandlersProps extends IBaseUseSocketHandlersProps<IUseBoardWikiDeletedResponse> {
    projectUID: string;
}

const useBoardWikiDeletedHandlers = ({ callback, projectUID }: IUseBoardWikiDeletedHandlersProps) => {
    return useSocketHandler<IUseBoardWikiDeletedResponse, IUseBoardWikiDeletedResponse>({
        topic: ESocketTopic.BoardWiki,
        topicId: projectUID,
        eventKey: `board-wiki-deleted-${projectUID}`,
        onProps: {
            name: SocketEvents.SERVER.BOARD.WIKI.DELETED,
            params: { uid: projectUID },
            callback,
            responseConverter: (data) => {
                ProjectWiki.Model.deleteModel(data.uid);
                return data;
            },
        },
    });
};

export default useBoardWikiDeletedHandlers;
