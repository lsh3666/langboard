import Box from "@/components/base/Box";
import Dialog from "@/components/base/Dialog";
import Flex from "@/components/base/Flex";
import ShineBorder from "@/components/base/ShineBorder";
import Skeleton from "@/components/base/Skeleton";
import Toast from "@/components/base/Toast";
import useGetCardDetails from "@/controllers/api/card/useGetCardDetails";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { BoardCardProvider, useBoardCard } from "@/core/providers/BoardCardProvider";
import { ROUTES } from "@/core/routing/constants";
import BoardCardActionList, { SkeletonBoardCardActionList } from "@/pages/BoardPage/components/card/action/BoardCardActionList";
import BoardCardChecklistGroup, { SkeletonBoardCardChecklistGroup } from "@/pages/BoardPage/components/card/checklist/BoardCardChecklistGroup";
import BoardCardColumnName, { SkeletonBoardCardColumnName } from "@/pages/BoardPage/components/card/BoardCardColumnName";
import BoardCardDeadline, { SkeletonBoardCardDeadline } from "@/pages/BoardPage/components/card/BoardCardDeadline";
import BoardCardDescription, { SkeletonBoardCardDescription } from "@/pages/BoardPage/components/card/BoardCardDescription";
import BoardCardAttachmentList, { SkeletonBoardCardAttachmentList } from "@/pages/BoardPage/components/card/attachment/BoardCardAttachmentList";
import BoardCardTitle, { SkeletonBoardCardTitle } from "@/pages/BoardPage/components/card/BoardCardTitle";
import BoardCommentForm, { SkeletonBoardCommentForm } from "@/pages/BoardPage/components/card/comment/BoardCommentForm";
import BoardCommentList, { SkeletonBoardCommentList } from "@/pages/BoardPage/components/card/comment/BoardCommentList";
import { forwardRef, memo, useEffect } from "react";
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
        <>
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
            <Flex gap="3" direction={{ initial: "col-reverse", sm: "row" }}>
                <Flex direction="col" gap="4" className="sm:w-[calc(100%_-_theme(spacing.40)_-_theme(spacing.3))]">
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
                    <BoardCardSection title="card.Comments">
                        <SkeletonBoardCommentList />
                    </BoardCardSection>
                </Flex>
                <Box w="full" maxW={{ sm: "40" }}>
                    <Box
                        z="10"
                        display="inline-block"
                        w="full"
                        position={{ sm: "sticky" }}
                        className="top-[calc(theme(spacing.16)_+_theme(spacing.3))]"
                    >
                        <BoardCardSection title="card.Actions" titleClassName="mb-2">
                            <SkeletonBoardCardActionList />
                        </BoardCardSection>
                    </Box>
                </Box>
            </Flex>
            <SkeletonBoardCommentForm />
        </>
    );
}

function BoardCardResult(): React.JSX.Element {
    const { card } = useBoardCard();
    const attachments = ProjectCardAttachment.Model.useModels((model) => model.card_uid === card.uid);
    const checklists = ProjectChecklist.Model.useModels((model) => model.card_uid === card.uid);
    const hasRunningBot = useHasRunningBot({ type: "card", targetUID: card.uid });

    useEffect(() => {
        return () => {
            getEditorStore().setCurrentEditor(null);
        };
    }, []);

    return (
        <>
            {hasRunningBot && <ShineBorder className="z-[999999]" />}
            <Dialog.Header className="sticky top-0 z-[100] mb-3 border-b-2 bg-background pb-3 text-left sm:-top-2">
                <BoardCardTitle key={`board-card-title-${card.uid}`} />
                <Flex gap="3">
                    <Dialog.Description>
                        <BoardCardColumnName key={`board-card-column-name-${card.uid}`} />
                    </Dialog.Description>
                    <BoardCardLabelList key={`board-card-label-list-${card.uid}`} />
                </Flex>
                <Dialog.CloseButton className="absolute right-0" />
            </Dialog.Header>
            <Flex gap="3" direction={{ initial: "col-reverse", sm: "row" }}>
                <Flex direction="col" gap="4" className="sm:w-[calc(100%_-_theme(spacing.40)_-_theme(spacing.3))]">
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
                    <BoardCardSection title="card.Comments">
                        <BoardCommentList key={`board-card-comment-list-${card.uid}`} />
                    </BoardCardSection>
                </Flex>
                <Box w="full" maxW={{ sm: "40" }}>
                    <Box
                        z="10"
                        display="inline-block"
                        w="full"
                        position={{ sm: "sticky" }}
                        className="top-[calc(theme(spacing.16)_+_theme(spacing.3))]"
                    >
                        <BoardCardSection title="card.Actions" titleClassName="mb-2">
                            <BoardCardActionList key={`board-card-action-list-${card.uid}`} />
                        </BoardCardSection>
                    </Box>
                </Box>
            </Flex>
            <BoardCommentForm />
        </>
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
