import { Toast } from "@/components/base";
import useBoardWikiCreatedHandlers from "@/controllers/socket/wiki/useBoardWikiCreatedHandlers";
import useBoardWikiProjectUsersUpdatedHandlers from "@/controllers/socket/wiki/useBoardWikiProjectUsersUpdatedHandlers";
import { usePageNavigateRef } from "@/core/hooks/usePageNavigate";
import useSwitchSocketHandlers from "@/core/hooks/useSwitchSocketHandlers";
import { AuthUser, Project, ProjectWiki, User } from "@/core/models";
import { ISocketContext, useSocket } from "@/core/providers/SocketProvider";
import { ROUTES } from "@/core/routing/constants";
import { getEditorStore } from "@/core/stores/EditorStore";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";

export type TBoardWikiMode = "reorder" | "delete" | "view";

export interface IBoardWikiContext {
    project: Project.TModel;
    socket: ISocketContext;
    wikis: ProjectWiki.TModel[];
    projectMembers: User.TModel[];
    currentUser: AuthUser.TModel;
    canAccessWiki: (shouldNavigate: bool, uid?: string) => bool;
    modeType: TBoardWikiMode;
    setModeType: React.Dispatch<React.SetStateAction<TBoardWikiMode>>;
    wikiTabListId: string;
    changeTab: (uid: string) => void;
}

interface IBoardWikiProviderProps {
    project: Project.TModel;
    projectMembers: User.TModel[];
    currentUser: AuthUser.TModel;
    children: React.ReactNode;
}

const initialContext = {
    project: {} as Project.TModel,
    socket: {} as ISocketContext,
    wikis: [],
    projectMembers: [],
    currentUser: {} as AuthUser.TModel,
    canAccessWiki: () => false,
    modeType: "view" as TBoardWikiMode,
    setModeType: () => {},
    wikiTabListId: "",
    changeTab: () => {},
};

const BoardWikiContext = createContext<IBoardWikiContext>(initialContext);

export const BoardWikiProvider = ({
    project,
    projectMembers: flatProjectMembers,
    currentUser,
    children,
}: IBoardWikiProviderProps): React.ReactNode => {
    const socket = useSocket();
    const navigate = usePageNavigateRef();
    const wikis = ProjectWiki.Model.useModels((model) => model.project_uid === project.uid, [project]);
    const { wikiUID } = useParams();
    const [projectMembers, setProjectMembers] = useState(flatProjectMembers);
    const [t] = useTranslation();
    const [modeType, setModeType] = useState<TBoardWikiMode>("view");
    const wikiTabListId = `board-wiki-tab-list-${project.uid}`;
    const boardWikiCreatedHandlers = useBoardWikiCreatedHandlers({
        projectUID: project.uid,
    });
    const projectUsersUpdatedHandlers = useMemo(
        () =>
            useBoardWikiProjectUsersUpdatedHandlers({
                projectUID: project.uid,
                callback: (data) => {
                    setProjectMembers(() => data.assigned_members);
                },
            }),
        [setProjectMembers]
    );

    useSwitchSocketHandlers({
        socket,
        handlers: [boardWikiCreatedHandlers, projectUsersUpdatedHandlers],
        dependencies: [projectUsersUpdatedHandlers],
    });

    useEffect(() => {
        const unsubscribes: (() => void)[] = [];
        for (let i = 0; i < wikis.length; ++i) {
            const wiki = wikis[i];
            const unsubscribe = wiki.subscribePrivateSocketHandlers(currentUser);
            unsubscribes.push(unsubscribe);
        }

        return () => {
            unsubscribes.forEach((unsubscribe) => unsubscribe());
        };
    }, [wikis]);

    const canAccessWiki = (shouldNavigate: bool, uid?: string) => {
        if (!uid) {
            return true;
        }

        const wiki = ProjectWiki.Model.getModel(uid);
        if (!wiki || wiki.project_uid !== project.uid || wiki.forbidden) {
            if (shouldNavigate) {
                Toast.Add.error(t("errors.requests.PE2005"));
                getEditorStore().setCurrentEditor(null);
                navigate(ROUTES.BOARD.WIKI(project.uid));
            }
            return false;
        }

        return true;
    };

    const changeTab = useCallback(
        (uid: string) => {
            if (uid === wikiUID) {
                return;
            }

            if (canAccessWiki(true, uid)) {
                if (!uid) {
                    navigate(ROUTES.BOARD.WIKI(project.uid));
                } else {
                    navigate(ROUTES.BOARD.WIKI_PAGE(project.uid, uid));
                }
                getEditorStore().setCurrentEditor(null);
            } else {
                navigate(ROUTES.BOARD.WIKI(project.uid));
                getEditorStore().setCurrentEditor(null);
            }
        },
        [project, wikiUID, navigate, canAccessWiki]
    );

    return (
        <BoardWikiContext.Provider
            value={{
                project,
                socket,
                wikis,
                projectMembers,
                currentUser,
                canAccessWiki,
                modeType,
                setModeType,
                wikiTabListId,
                changeTab,
            }}
        >
            {children}
        </BoardWikiContext.Provider>
    );
};

export const useBoardWiki = () => {
    const context = useContext(BoardWikiContext);
    if (!context) {
        throw new Error("useBoardWiki must be used within a BoardWikiProvider");
    }
    return context;
};
