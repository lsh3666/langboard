import Box from "@/components/base/Box";
import Button from "@/components/base/Button";
import Dialog from "@/components/base/Dialog";
import Flex from "@/components/base/Flex";
import IconComponent from "@/components/base/IconComponent";
import ScrollArea from "@/components/base/ScrollArea";
import ShineBorder from "@/components/base/ShineBorder";
import Skeleton from "@/components/base/Skeleton";
import Toast from "@/components/base/Toast";
import useGetCardDetails from "@/controllers/api/card/useGetCardDetails";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { BoardCardProvider, useBoardCard } from "@/core/providers/BoardCardProvider";
import { ROUTES } from "@/core/routing/constants";
import BoardCardActionList, { SkeletonBoardCardActionList } from "@/pages/BoardPage/components/card/action/BoardCardActionList";
import BoardCardActionAttachFile from "@/pages/BoardPage/components/card/action/file/BoardCardActionAttachFile";
import BoardCardActionRelationship from "@/pages/BoardPage/components/card/action/relationship/BoardCardActionRelationship";
import BoardCardChecklistGroup, { SkeletonBoardCardChecklistGroup } from "@/pages/BoardPage/components/card/checklist/BoardCardChecklistGroup";
import BoardCardColumnName, { SkeletonBoardCardColumnName } from "@/pages/BoardPage/components/card/BoardCardColumnName";
import BoardCardDeadline, { SkeletonBoardCardDeadline } from "@/pages/BoardPage/components/card/BoardCardDeadline";
import BoardCardDescription, { SkeletonBoardCardDescription } from "@/pages/BoardPage/components/card/BoardCardDescription";
import BoardCardAttachmentList, { SkeletonBoardCardAttachmentList } from "@/pages/BoardPage/components/card/attachment/BoardCardAttachmentList";
import BoardCardTitle, { SkeletonBoardCardTitle } from "@/pages/BoardPage/components/card/BoardCardTitle";
import BoardCommentForm from "@/pages/BoardPage/components/card/comment/BoardCommentForm";
import BoardCommentList, { SkeletonBoardCommentList } from "@/pages/BoardPage/components/card/comment/BoardCommentList";
import { forwardRef, memo, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import BoardCardMemberList from "@/pages/BoardPage/components/card/BoardCardMemberList";
import { SkeletonUserAvatarList } from "@/components/UserAvatarList";
import { usePageHeader } from "@/core/providers/PageHeaderProvider";
import { usePageNavigateRef } from "@/core/hooks/usePageNavigate";
import { useSocket } from "@/core/providers/SocketProvider";
import BoardCardLabelList from "@/pages/BoardPage/components/card/label/BoardCardLabelList";
import { AuthUser, ProjectCardAttachment, ProjectChecklist } from "@/core/models";
import useCardDeletedHandlers from "@/controllers/socket/card/useCardDeletedHandlers";
import { EHttpStatus, ESocketTopic } from "@langboard/core/enums";
import { getEditorStore } from "@/core/stores/EditorStore";
import { useHasRunningBot } from "@/core/stores/BotStatusStore";
import { ProjectRole } from "@/core/models/roles";
import { cn } from "@/core/utils/ComponentUtils";

export interface IBoardCardProps {
    projectUID: string;
    cardUID: string;
    currentUser: AuthUser.TModel;
    viewportRef: React.RefObject<HTMLDivElement | null>;
}

const BoardCard = memo(({ projectUID, cardUID, currentUser, viewportRef }: IBoardCardProps): React.JSX.Element => {
    const { setPageAliasRef } = usePageHeader();
    const { data: cardData, isFetching, error } = useGetCardDetails({ project_uid: projectUID, card_uid: cardUID });
    const [t] = useTranslation();
    const socket = useSocket();
    const navigate = usePageNavigateRef();
    const { on: onCardDeletedHandlers } = useCardDeletedHandlers({
        projectUID,
        cardUID,
        callback: () => {
            Toast.Add.error(t("project.errors.Card deleted."));
            navigate(ROUTES.BOARD.MAIN(projectUID), { replace: true });
        },
    });

    useEffect(() => {
        if (!error) {
            return;
        }

        const { handle } = setupApiErrorHandler({
            [EHttpStatus.HTTP_403_FORBIDDEN]: {
                after: () => navigate(ROUTES.ERROR(EHttpStatus.HTTP_403_FORBIDDEN), { replace: true }),
            },
            [EHttpStatus.HTTP_404_NOT_FOUND]: {
                after: () => navigate(ROUTES.ERROR(EHttpStatus.HTTP_404_NOT_FOUND), { replace: true }),
            },
        });

        handle(error);
    }, [error]);

    useEffect(() => {
        setPageAliasRef.current(cardData?.card?.title || "");
        if (!cardData || isFetching) {
            return;
        }

        socket.subscribe(ESocketTopic.BoardCard, [cardUID], () => {
            onCardDeletedHandlers();
        });

        return () => {
            socket.unsubscribe(ESocketTopic.BoardCard, [cardUID]);
        };
    }, [isFetching]);

    return (
        <>
            {!cardData || isFetching ? (
                <SkeletonBoardCard />
            ) : (
                <BoardCardProvider projectUID={projectUID} card={cardData.card} currentUser={currentUser} viewportRef={viewportRef}>
                    <BoardCardResult />
                </BoardCardProvider>
            )}
        </>
    );
});

export function SkeletonBoardCard(): React.JSX.Element {
    return (
        <Flex direction="col" className="h-full min-h-0 gap-4">
            <Box className="relative min-h-0 flex-1 rounded-2xl border bg-background px-4 py-4 shadow-2xl sm:px-6 sm:py-6">
                <Flex
                    direction="col"
                    mb="3"
                    position="sticky"
                    top={{ initial: "0", sm: "-2" }}
                    pb="3"
                    className="z-[100] space-y-1.5 border-b-2 bg-background text-left"
                >
                    <SkeletonBoardCardTitle />
                    <Flex gap="3">
                        <Dialog.Description asChild>
                            <SkeletonBoardCardColumnName />
                        </Dialog.Description>
                    </Flex>
                    <Skeleton position="absolute" right="0" size="6" rounded="sm" className="opacity-70" />
                </Flex>
                <Flex gap="3" direction={{ initial: "col-reverse", sm: "row" }} className="min-h-0">
                    <Flex direction="col" gap="4" className="min-h-0 sm:w-[calc(100%_-_theme(spacing.40)_-_theme(spacing.3))]">
                        <Flex direction={{ initial: "col", sm: "row" }} gap="4">
                            <BoardCardSection title="card.Members" className="sm:w-1/2" contentClassName="flex gap-1">
                                <SkeletonUserAvatarList count={6} size={{ initial: "sm", lg: "default" }} spacing="none" className="space-x-1" />
                            </BoardCardSection>
                            <BoardCardSection title="card.Deadline" className="sm:w-1/2">
                                <SkeletonBoardCardDeadline />
                            </BoardCardSection>
                        </Flex>
                        <BoardCardSection title="card.Description" className="relative min-h-56">
                            <SkeletonBoardCardDescription />
                        </BoardCardSection>
                        <BoardCardSection title="card.Checklists">
                            <SkeletonBoardCardChecklistGroup />
                        </BoardCardSection>
                        <BoardCardSection title="card.Attached files">
                            <SkeletonBoardCardAttachmentList />
                        </BoardCardSection>
                        <Box className="sm:hidden">
                            <BoardCardSection title="card.Comments">
                                <SkeletonBoardCommentList />
                            </BoardCardSection>
                        </Box>
                        <Box className="sm:hidden">
                            <BoardCardSection title="card.Actions" titleClassName="mb-2">
                                <SkeletonBoardCardActionList />
                            </BoardCardSection>
                        </Box>
                    </Flex>
                    <Box w="full" maxW={{ sm: "40" }} className="hidden shrink-0 sm:block">
                        <Box z="10" display="inline-block" w="full">
                            <BoardCardSection title="card.Actions" titleClassName="mb-2">
                                <SkeletonBoardCardActionList />
                            </BoardCardSection>
                        </Box>
                    </Box>
                </Flex>
            </Box>
            <Flex justify="center" className="pointer-events-none z-[110] shrink-0">
                <Box className="pointer-events-auto rounded-full border bg-background px-3 py-2 shadow-lg">
                    <Flex gap="2">
                        <Skeleton className="h-9 w-28 rounded-full" />
                        <Skeleton className="h-9 w-28 rounded-full" />
                    </Flex>
                </Box>
            </Flex>
        </Flex>
    );
}

function BoardCardResult(): React.JSX.Element {
    const { card, isActionPanelOpen } = useBoardCard();
    const attachments = ProjectCardAttachment.Model.useModels((model) => model.card_uid === card.uid);
    const checklists = ProjectChecklist.Model.useModels((model) => model.card_uid === card.uid);
    const hasRunningBot = useHasRunningBot({ type: "card", targetUID: card.uid });
    const contentViewportRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        return () => {
            getEditorStore().setCurrentEditor(null);
        };
    }, []);

    return (
        <>
            {hasRunningBot && <ShineBorder className="z-[999999]" />}
            <Flex direction="col" className="h-full min-h-0 gap-4">
                <Box className="relative min-h-0 flex-1 rounded-2xl border bg-background px-4 py-4 shadow-2xl sm:px-6 sm:py-6">
                    <Box className="hidden sm:block">
                        <BoardCardActionRelationship buttonClassName="" />
                    </Box>
                    <Box className="relative flex h-full min-h-0 flex-col overflow-visible">
                        <Dialog.Header className="sticky top-0 z-[100] mb-3 shrink-0 border-b-2 bg-background pb-3 text-left sm:-top-2">
                            <BoardCardTitle key={`board-card-title-${card.uid}`} />
                            <Flex gap="3">
                                <Dialog.Description>
                                    <BoardCardColumnName key={`board-card-column-name-${card.uid}`} />
                                </Dialog.Description>
                                <BoardCardLabelList key={`board-card-label-list-${card.uid}`} />
                            </Flex>
                            <Dialog.CloseButton className="absolute right-0" />
                        </Dialog.Header>
                        <Flex gap="3" direction={{ initial: "col-reverse", sm: "row" }} className="min-h-0 flex-1">
                            <ScrollArea.Root className="min-h-0 flex-1" viewportRef={contentViewportRef}>
                                <Flex direction="col" gap="4" className="min-w-0 pb-6 pr-1">
                                    <Flex direction={{ initial: "col", sm: "row" }} gap="4">
                                        <BoardCardSection title="card.Members" className="sm:w-1/2" contentClassName="flex gap-1">
                                            <BoardCardMemberList key={`board-card-member-list-${card.uid}`} />
                                        </BoardCardSection>
                                        <BoardCardSection title="card.Deadline" className="sm:w-1/2">
                                            <BoardCardDeadline key={`board-card-deadline-${card.uid}`} />
                                        </BoardCardSection>
                                    </Flex>
                                    <BoardCardSection title="card.Description" className="relative min-h-56">
                                        <BoardCardDescription key={`board-card-description-${card.uid}`} />
                                    </BoardCardSection>
                                    {checklists.length > 0 && (
                                        <BoardCardSection title="card.Checklists">
                                            <BoardCardChecklistGroup key={`board-card-checklist-${card.uid}`} />
                                        </BoardCardSection>
                                    )}
                                    {attachments.length > 0 && (
                                        <BoardCardSection title="card.Attached files">
                                            <BoardCardAttachmentList key={`board-card-attachment-list-${card.uid}`} />
                                        </BoardCardSection>
                                    )}
                                    <Box className={cn("sm:hidden", !isActionPanelOpen && "hidden")}>
                                        <BoardCardSection title="card.Actions" titleClassName="mb-2">
                                            <BoardCardActionList key={`board-card-action-list-mobile-${card.uid}`} />
                                        </BoardCardSection>
                                    </Box>
                                    <BoardCardMobileComments scrollableRef={contentViewportRef} />
                                </Flex>
                            </ScrollArea.Root>
                            <BoardCardCommentPanel />
                            <Box w="full" maxW={{ sm: "40" }} className={cn("hidden shrink-0 sm:block", !isActionPanelOpen && "sm:hidden")}>
                                <BoardCardSection title="card.Actions" titleClassName="mb-2">
                                    <BoardCardActionList key={`board-card-action-list-${card.uid}`} />
                                </BoardCardSection>
                            </Box>
                        </Flex>
                        <Box className="pt-3 sm:hidden">
                            <BoardCommentForm variant="mobile" />
                        </Box>
                    </Box>
                </Box>
                <BoardCardFloatingNav />
            </Flex>
        </>
    );
}

function BoardCardMobileComments({ scrollableRef }: { scrollableRef?: React.RefObject<HTMLDivElement | null> }): React.JSX.Element | null {
    const { card, isCommentPanelOpen, commentLayoutMode } = useBoardCard();

    if (!isCommentPanelOpen || commentLayoutMode !== "mobile") {
        return null;
    }

    return (
        <Box className="sm:hidden">
            <BoardCardSection title="card.Comments">
                <BoardCommentList key={`board-card-comment-list-mobile-${card.uid}`} scrollableRef={scrollableRef} />
            </BoardCardSection>
        </Box>
    );
}

function BoardCardCommentPanel(): React.JSX.Element {
    const { card, isCommentPanelOpen, commentLayoutMode } = useBoardCard();
    const commentViewportRef = useRef<HTMLDivElement | null>(null);
    const [t] = useTranslation();
    const isPanelLayout = commentLayoutMode === "panel";

    return (
        <Box
            className={cn(
                "hidden min-h-0 overflow-hidden transition-all duration-300 sm:block",
                isPanelLayout && isCommentPanelOpen ? "sm:w-[360px] sm:min-w-[360px]" : "sm:w-0 sm:min-w-0 sm:border-transparent"
            )}
            aria-hidden={!isPanelLayout || !isCommentPanelOpen}
        >
            <Box
                className={cn(
                    "h-full",
                    "overflow-hidden bg-background transition-opacity duration-200",
                    isPanelLayout && isCommentPanelOpen ? "opacity-100" : "pointer-events-none opacity-0"
                )}
            >
                <Flex direction="col" className="h-full min-h-0">
                    <Box>{t("card.Comments")}</Box>
                    <Box className="px-4 py-3">
                        <BoardCommentForm variant="panel" />
                    </Box>
                    <ScrollArea.Root className="min-h-0 flex-1" viewportRef={commentViewportRef}>
                        <BoardCommentList key={`board-card-comment-list-${card.uid}`} scrollableRef={commentViewportRef} className="px-4 py-3" />
                    </ScrollArea.Root>
                </Flex>
            </Box>
        </Box>
    );
}

function BoardCardFloatingNav(): React.JSX.Element {
    const { isCommentPanelOpen, toggleCommentPanel, isActionPanelOpen, toggleActionPanel, hasRoleAction } = useBoardCard();
    const [t] = useTranslation();
    const canAttachFile = hasRoleAction(ProjectRole.EAction.CardUpdate);

    return (
        <Flex justify="center" className="pointer-events-none z-[110]">
            <Flex items="center" gap="1" className={cn("pointer-events-auto rounded-full border bg-background shadow-lg backdrop-blur")}>
                {canAttachFile && (
                    <BoardCardActionAttachFile
                        buttonClassName={"h-10 gap-1 rounded-full border-0 bg-transparent px-4 text-sm shadow-none hover:bg-accent"}
                    >
                        <>
                            <IconComponent icon="file-up" size="4" />
                            {t("card.Attach file")}
                        </>
                    </BoardCardActionAttachFile>
                )}
                <Button
                    type="button"
                    variant={isActionPanelOpen ? "default" : "ghost"}
                    className="h-10 gap-1 rounded-full px-4"
                    onClick={toggleActionPanel}
                >
                    <IconComponent icon="list" size="4" />
                    {t("card.Actions")}
                </Button>
                <Button
                    type="button"
                    variant={isCommentPanelOpen ? "default" : "ghost"}
                    className="h-10 gap-1 rounded-full px-4"
                    onClick={toggleCommentPanel}
                >
                    <IconComponent icon="message-square" size="4" />
                    {t("card.Comments")}
                </Button>
            </Flex>
        </Flex>
    );
}

interface IBoardCardSectionProps extends React.HTMLAttributes<HTMLDivElement> {
    title: string;
    titleClassName?: string;
    contentClassName?: string;
}

const BoardCardSection = forwardRef<HTMLDivElement, IBoardCardSectionProps>(
    ({ title, titleClassName, contentClassName, children, ...props }, ref) => {
        const [t] = useTranslation();
        return (
            <Box {...props} ref={ref}>
                <Box mb="1" className={titleClassName}>
                    {t(title)}
                </Box>
                <Box className={contentClassName}>{children}</Box>
            </Box>
        );
    }
);

export default BoardCard;
