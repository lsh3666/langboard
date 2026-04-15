import { createContext, useContext, useEffect, useRef, useState } from "react";
import { AuthUser, ProjectCard } from "@/core/models";
import useRoleActionFilter from "@/core/hooks/useRoleActionFilter";
import { ISocketContext, useSocket } from "@/core/providers/SocketProvider";
import { TUserLikeModel } from "@/core/models/ModelRegistry";
import { ProjectRole } from "@/core/models/roles";

// Must stay aligned with Tailwind `md` breakpoint in `tailwind.config.js` (768px).
const DESKTOP_COMMENT_BREAKPOINT = 768;

export interface IBoardCardContext {
    projectUID: string;
    card: ProjectCard.TModel;
    currentUser: AuthUser.TModel;
    viewportRef: React.RefObject<HTMLDivElement | null>;
    hasRoleAction: ReturnType<typeof useRoleActionFilter<ProjectRole.TActions>>["hasRoleAction"];
    socket: ISocketContext;
    replyRef: React.RefObject<(target: TUserLikeModel) => void>;
    isCommentPanelOpen: bool;
    setIsCommentPanelOpen: React.Dispatch<React.SetStateAction<bool>>;
    toggleCommentPanel: () => void;
    isActionPanelOpen: bool;
    setIsActionPanelOpen: React.Dispatch<React.SetStateAction<bool>>;
    toggleActionPanel: () => void;
    commentLayoutMode: "mobile" | "panel";
    sharedClassNames: {
        popoverContent: string;
    };
}

interface IBoardCardProviderProps {
    projectUID: string;
    card: ProjectCard.TModel;
    currentUser: AuthUser.TModel;
    viewportRef: React.RefObject<HTMLDivElement | null>;
    children: React.ReactNode;
}

const initialContext = {
    projectUID: "",
    card: {} as ProjectCard.TModel,
    currentUser: {} as AuthUser.TModel,
    viewportRef: { current: null },
    hasRoleAction: () => false,
    socket: {} as ISocketContext,
    replyRef: { current: () => {} },
    isCommentPanelOpen: false,
    setIsCommentPanelOpen: () => false,
    toggleCommentPanel: () => {},
    isActionPanelOpen: false,
    setIsActionPanelOpen: () => false,
    toggleActionPanel: () => {},
    commentLayoutMode: "mobile" as const,
    sharedClassNames: {} as IBoardCardContext["sharedClassNames"],
};

const BoardCardContext = createContext<IBoardCardContext>(initialContext);

export const BoardCardProvider = ({ projectUID, card, currentUser, viewportRef, children }: IBoardCardProviderProps): React.ReactNode => {
    const socket = useSocket();
    const replyRef = useRef<(target: TUserLikeModel) => void>(() => {});
    const [isCommentPanelOpen, setIsCommentPanelOpen] = useState(false);
    const [isActionPanelOpen, setIsActionPanelOpen] = useState(false);
    const [commentLayoutMode, setCommentLayoutMode] = useState<"mobile" | "panel">("mobile");
    const currentUserRoleActions = card.useField("current_auth_role_actions");
    const { hasRoleAction } = useRoleActionFilter(currentUserRoleActions);
    const sharedClassNames = {
        popoverContent: "w-full max-w-[calc(var(--radix-popper-available-width)_-_theme(spacing.10))]",
    };

    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }

        const mediaQuery = window.matchMedia(`(min-width: ${DESKTOP_COMMENT_BREAKPOINT}px)`);
        const updateLayoutMode = () => {
            setCommentLayoutMode(mediaQuery.matches ? "panel" : "mobile");
        };

        updateLayoutMode();
        mediaQuery.addEventListener("change", updateLayoutMode);

        return () => {
            mediaQuery.removeEventListener("change", updateLayoutMode);
        };
    }, []);

    return (
        <BoardCardContext.Provider
            value={{
                projectUID,
                card,
                currentUser,
                viewportRef,
                hasRoleAction,
                socket,
                replyRef,
                isCommentPanelOpen,
                setIsCommentPanelOpen,
                toggleCommentPanel: () => setIsCommentPanelOpen((prev) => !prev),
                isActionPanelOpen,
                setIsActionPanelOpen,
                toggleActionPanel: () => setIsActionPanelOpen((prev) => !prev),
                commentLayoutMode,
                sharedClassNames,
            }}
        >
            {children}
        </BoardCardContext.Provider>
    );
};

export const useBoardCard = () => {
    const context = useContext(BoardCardContext);
    if (!context) {
        throw new Error("useBoardCard must be used within a BoardCardProvider");
    }
    return context;
};
