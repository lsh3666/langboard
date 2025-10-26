import { Flex, Label, Skeleton, Switch, Toast } from "@/components/base";
import { SkeletonUserAvatarList } from "@/components/UserAvatarList";
import useChangeWikiPublic from "@/controllers/api/wiki/useChangeWikiPublic";
import useUpdateWikiAssignees from "@/controllers/api/wiki/useUpdateWikiAssignees";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { ProjectWiki, User } from "@/core/models";
import { useBoardWiki } from "@/core/providers/BoardWikiProvider";
import { cn } from "@/core/utils/ComponentUtils";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ROUTES } from "@/core/routing/constants";
import MultiSelectAssignee, { IFormProps, TSaveHandler } from "@/components/MultiSelectAssignee";
import { TUserLikeModel } from "@/core/models/ModelRegistry";
import { usePageNavigateRef } from "@/core/hooks/usePageNavigate";
import { EHttpStatus } from "@langboard/core/enums";

export interface IWikiPrivateOptionProps {
    wiki: ProjectWiki.TModel;
    changeTab: (uid: string) => void;
}

export function SkeletonWikiPrivateOption() {
    return (
        <Flex items="center" gap="4" pl="1" h="8" justify={{ initial: "between", sm: "start" }}>
            <Flex inline items="center" gap="2">
                <Skeleton h="6" w="11" rounded="full" />
                <Skeleton h="6" w="20" />
            </Flex>
            <SkeletonUserAvatarList count={4} size="sm" spacing="none" />
        </Flex>
    );
}

const WikiPrivateOption = memo(({ wiki, changeTab }: IWikiPrivateOptionProps) => {
    const [t] = useTranslation();
    const navigate = usePageNavigateRef();
    const { project, projectMembers, currentUser } = useBoardWiki();
    const isPublic = wiki.useField("is_public");
    const forbidden = wiki.useField("forbidden");
    const isChangedTabRef = useRef(false);
    const assignedMembers = wiki.useForeignField("assigned_members");
    const groups = currentUser.useForeignField("user_groups");
    const allItems = useMemo(() => projectMembers.filter((item) => item.uid !== currentUser.uid), [projectMembers]);
    const originalAssignees = useMemo(() => assignedMembers.filter((item) => item.uid !== currentUser.uid), [assignedMembers]);
    const [isValidating, setIsValidating] = useState(false);
    const { mutateAsync: changeWikiPublicMutateAsync } = useChangeWikiPublic({ interceptToast: true });
    const { mutateAsync: updateWikiAssigneesMutateAsync } = useUpdateWikiAssignees({ interceptToast: true });

    useEffect(() => {
        if (forbidden && !isChangedTabRef.current) {
            Toast.Add.error(t("errors.requests.PE2005"));
            changeTab("");
            isChangedTabRef.current = true;
        } else {
            isChangedTabRef.current = false;
        }
    }, [forbidden]);

    const savePrivateState = (privateState: bool) => {
        if (isValidating || privateState === !isPublic) {
            return;
        }

        setIsValidating(true);

        const promise = changeWikiPublicMutateAsync({
            project_uid: project.uid,
            wiki_uid: wiki.uid,
            is_public: !privateState,
        });

        Toast.Add.promise(promise, {
            loading: t("common.Changing..."),
            error: (error) => {
                const messageRef = { message: "" };
                const { handle } = setupApiErrorHandler(
                    {
                        [EHttpStatus.HTTP_403_FORBIDDEN]: {
                            after: () => navigate(ROUTES.BOARD.WIKI(project.uid)),
                        },
                    },
                    messageRef
                );

                handle(error);
                return messageRef.message;
            },
            success: () => {
                return t("successes.Public state changed successfully.");
            },
            finally: () => {
                setIsValidating(false);
            },
        });
    };

    const saveAssignees = (items: TUserLikeModel[]) => {
        if (isValidating || isPublic) {
            return;
        }

        setIsValidating(true);

        const newAssignees = items.map((item) => item.uid);
        if (wiki.assigned_members.some((member) => member.uid === currentUser.uid)) {
            newAssignees.unshift(currentUser.uid);
        }

        const promise = updateWikiAssigneesMutateAsync({
            project_uid: project.uid,
            wiki_uid: wiki.uid,
            assignees: newAssignees,
        });

        Toast.Add.promise(promise, {
            loading: t("common.Updating..."),
            error: (error) => {
                const messageRef = { message: "" };
                const { handle } = setupApiErrorHandler(
                    {
                        [EHttpStatus.HTTP_403_FORBIDDEN]: {
                            after: () => navigate(ROUTES.BOARD.WIKI(project.uid)),
                        },
                    },
                    messageRef
                );

                handle(error);
                return messageRef.message;
            },
            success: () => {
                return t("successes.Assigned bots and members updated successfully.");
            },
            finally: () => {
                setIsValidating(false);
            },
        });
    };

    return (
        <Flex items="center" gap="4" h="8">
            <Label display="inline-flex" cursor="pointer" items="center" gap="2">
                <Switch checked={!isPublic} onCheckedChange={savePrivateState} />
                <span>{t(`wiki.${isPublic ? "Public" : "Private"}`)}</span>
            </Label>
            {!isPublic && (
                <MultiSelectAssignee.Popover
                    popoverButtonProps={{
                        size: "icon",
                        className: "size-8",
                        title: t("project.Assign members"),
                    }}
                    popoverContentProps={{
                        className: cn(
                            "max-w-[calc(100vw_-_theme(spacing.20))]",
                            "sm:max-w-[calc(theme(screens.sm)_-_theme(spacing.60))]",
                            "lg:max-w-[calc(theme(screens.md)_-_theme(spacing.60))]",
                            "min-w-[min(theme(spacing.20),100%)]"
                        ),
                        align: "start",
                    }}
                    userAvatarListProps={{
                        maxVisible: 4,
                        size: "sm",
                        spacing: "3",
                        listAlign: "start",
                    }}
                    placeholder={t("wiki.Select members and bots...")}
                    allSelectables={allItems}
                    originalAssignees={originalAssignees}
                    showableAssignees={assignedMembers}
                    tagContentProps={{
                        scope: {
                            projectUID: project.uid,
                            wikiUID: wiki.uid,
                        },
                    }}
                    addIconSize="6"
                    save={saveAssignees as TSaveHandler}
                    createSearchKeywords={((item: User.TModel) => [item.email, item.firstname, item.lastname]) as IFormProps["createSearchKeywords"]}
                    createLabel={(item) => {
                        item = item as User.TModel;
                        return `${item.firstname} ${item.lastname}`.trim();
                    }}
                    withUserGroups
                    groups={groups}
                    filterGroupUser={(item: User.TModel) => item.isValidUser() && projectMembers.some((member) => member.uid === item.uid)}
                    canEdit
                />
            )}
        </Flex>
    );
});

export default WikiPrivateOption;
