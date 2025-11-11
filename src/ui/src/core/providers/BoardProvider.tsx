import { createContext, memo, useContext, useEffect, useMemo, useRef } from "react";
import { AuthUser, GlobalRelationshipType, Project, ProjectCard, ProjectCardRelationship, ProjectColumn, ProjectLabel, User } from "@/core/models";
import useRoleActionFilter from "@/core/hooks/useRoleActionFilter";
import { To } from "react-router";
import { ISocketContext, useSocket } from "@/core/providers/SocketProvider";
import { ROUTES } from "@/core/routing/constants";
import { Toast } from "@/components/base";
import { useTranslation } from "react-i18next";
import { useBoardController } from "@/core/providers/BoardController";
import useSearchFilters, { ISearchFilterMap } from "@/core/hooks/useSearchFilters";
import { IPageNavigateOptions, usePageNavigateRef } from "@/core/hooks/usePageNavigate";
import { Utils } from "@langboard/core/utils";

export interface IFilterMap extends ISearchFilterMap {
    keyword?: string[];
    members?: string[];
    labels?: string[];
    parents?: string[];
    children?: string[];
}

export const BOARD_FILTER_KEYS = ["keyword", "members", "labels", "parents", "children"] as (keyof IFilterMap)[];

export interface IBoardContext {
    socket: ISocketContext;
    project: Project.TModel;
    columns: ProjectColumn.TModel[];
    cards: ProjectCard.TModel[];
    cardsMap: Record<string, ProjectCard.TModel>;
    currentUser: AuthUser.TModel;
    globalRelationshipTypes: GlobalRelationshipType.TModel[];
    hasRoleAction: ReturnType<typeof useRoleActionFilter<Project.TRoleActions>>["hasRoleAction"];
    filters: IFilterMap;
    navigateWithFilters: (to?: To, options?: IPageNavigateOptions) => void;
    filterMember: (member: User.TModel) => bool;
    filterLabel: (label: ProjectLabel.TModel) => bool;
    filterCard: (card: ProjectCard.TModel) => bool;
    filterCardMember: (card: ProjectCard.TModel) => bool;
    filterCardLabels: (card: ProjectCard.TModel) => bool;
    filterCardRelationships: (card: ProjectCard.TModel) => bool;
    canDragAndDrop: bool;
}

interface IBoardProviderProps {
    project: Project.TModel;
    currentUser: AuthUser.TModel;
    children: React.ReactNode;
}

const initialContext = {
    socket: {} as ISocketContext,
    project: {} as Project.TModel,
    columns: [],
    cards: [],
    cardsMap: {},
    currentUser: {} as AuthUser.TModel,
    globalRelationshipTypes: [],
    hasRoleAction: () => false,
    filters: {},
    navigateWithFilters: () => {},
    filterMember: () => true,
    filterLabel: () => true,
    filterCard: () => true,
    filterCardMember: () => true,
    filterCardLabels: () => true,
    filterCardRelationships: () => true,
    canDragAndDrop: false,
};

const BoardContext = createContext<IBoardContext>(initialContext);

export const BoardProvider = memo(({ project, currentUser, children }: IBoardProviderProps): React.ReactNode => {
    const navigate = usePageNavigateRef();
    const socket = useSocket();
    const { selectCardViewType } = useBoardController();
    const [t] = useTranslation();
    const members = project.useForeignFieldArray("all_members");
    const {
        filters,
        toString: filtersToString,
        unique: uniqueFilters,
        forceUpdate: forceUpdateFilters,
    } = useSearchFilters<IFilterMap>({
        filterKeys: BOARD_FILTER_KEYS,
        searchKey: "filters",
    });
    const isAdmin = currentUser.useField("is_admin");
    const currentUserRoleActions = project.useField("current_auth_role_actions");
    const { hasRoleAction } = useRoleActionFilter(currentUserRoleActions);
    const columns = ProjectColumn.Model.useModels((model) => model.project_uid === project.uid);
    const cards = ProjectCard.Model.useModels((model) => model.project_uid === project.uid);
    const forbiddenMessageIdRef = useRef<string | number | null>(null);
    const cardsMap = useMemo(() => {
        const map: Record<string, ProjectCard.TModel> = {};
        cards.forEach((card) => {
            map[card.uid] = card;
        });
        return map;
    }, [cards]);
    const globalRelationshipTypes = GlobalRelationshipType.Model.useModels(() => true, [selectCardViewType, filters]);
    const canDragAndDrop = useMemo(() => hasRoleAction(Project.ERoleAction.Update) && !selectCardViewType, [hasRoleAction, selectCardViewType]);

    useEffect(() => {
        if (isAdmin || members.some((member) => member.uid === currentUser.uid) || forbiddenMessageIdRef.current) {
            return;
        }

        const toastId = Toast.Add.error(t("project.errors.You are not a member of this project."), {
            onAutoClose: () => {
                forbiddenMessageIdRef.current = null;
            },
            onDismiss: () => {
                forbiddenMessageIdRef.current = null;
            },
        });
        forbiddenMessageIdRef.current = toastId;
        navigate(ROUTES.DASHBOARD.PROJECTS.ALL);
    }, [isAdmin, members]);

    const navigateWithFilters = (to?: To, options?: IPageNavigateOptions) => {
        uniqueFilters();
        const newFiltersString = filtersToString();

        if (Utils.Type.isString(to)) {
            to = { pathname: to };
        } else {
            to = { ...to };
        }

        const params = new URLSearchParams(to.search);
        if (!newFiltersString.length) {
            params.delete("filters");
        } else {
            params.set("filters", newFiltersString);
        }

        to = { ...to, search: params.toString() };

        navigate(to, options);
        forceUpdateFilters();
    };

    const filterMember = (member: User.TModel) => {
        const keyword = filters.keyword?.join(",");
        if (!keyword) {
            return true;
        }

        return (
            member.email.includes(keyword) ||
            member.username.toLowerCase().includes(keyword.toLowerCase()) ||
            member.firstname.toLowerCase().includes(keyword.toLowerCase()) ||
            member.lastname.toLowerCase().includes(keyword.toLowerCase())
        );
    };

    const filterLabel = (label: ProjectLabel.TModel) => {
        const keyword = filters.keyword?.join(",");
        if (!keyword) {
            return true;
        }

        return label.name.toLowerCase().includes(keyword.toLowerCase()) || label.description.toLowerCase().includes(keyword.toLowerCase());
    };

    const filterCard = (card: ProjectCard.TModel) => {
        const keyword = filters.keyword?.join(",");
        if (!keyword) {
            return true;
        }

        return (
            card.title.toLowerCase().includes(keyword.toLowerCase()) ||
            card.description.content.toLowerCase().includes(keyword.toLowerCase()) ||
            User.Model.getModels(card.member_uids).some((member) => filterMember(member))
        );
    };

    const filterCardMember = (card: ProjectCard.TModel) => {
        if (!filters.members?.length) {
            return true;
        }

        if (filters.members.includes("none") && !card.member_uids.length) {
            return true;
        }

        for (let i = 0; i < filters.members.length; ++i) {
            const userEmail = filters.members[i];
            let user;
            if (userEmail === "me") {
                user = currentUser;
            } else {
                user = project.all_members.find((member) => member.email === userEmail);
            }

            if (!user) {
                continue;
            }

            const projectMembers = User.Model.getModels(card.member_uids);
            if (projectMembers.some((member) => member.email === user.email && member.username === user.username)) {
                return true;
            }
        }

        return false;
    };

    const filterCardLabels = (card: ProjectCard.TModel) => {
        if (!filters.labels?.length) {
            return true;
        }

        return !!card.labels.length && filters.labels.some((labelUID) => card.labels.map((label) => label.uid).includes(labelUID));
    };

    const filterCardRelationships = (card: ProjectCard.TModel) => {
        if (!filters.parents?.length && !filters.children?.length) {
            return true;
        }

        const filter = (relationshipType: ProjectCardRelationship.TRelationship) => {
            const oppositeKey = relationshipType === "parents" ? "child_card_uid" : "parent_card_uid";
            return (
                filters[relationshipType]!.some((oppositeUID) =>
                    card.relationships.some((relationship) => relationship[oppositeKey] === oppositeUID)
                ) || filters[relationshipType]!.includes(card.uid)
            );
        };

        if (filters.parents?.length && filters.children?.length) {
            return filter("parents") || filter("children");
        } else if (filters.parents?.length) {
            return filter("parents");
        } else if (filters.children?.length) {
            return filter("children");
        } else {
            return true;
        }
    };

    return (
        <BoardContext.Provider
            value={{
                socket,
                project,
                columns,
                cards,
                cardsMap,
                currentUser,
                globalRelationshipTypes,
                hasRoleAction,
                filters,
                navigateWithFilters,
                filterMember,
                filterLabel,
                filterCard,
                filterCardMember,
                filterCardLabels,
                filterCardRelationships,
                canDragAndDrop,
            }}
        >
            {children}
        </BoardContext.Provider>
    );
});

export const useBoard = () => {
    const context = useContext(BoardContext);
    if (!context) {
        throw new Error("useBoard must be used within a BoardProvider");
    }
    return context;
};
