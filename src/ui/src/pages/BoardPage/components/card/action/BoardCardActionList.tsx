import { Skeleton } from "@/components/base";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { Project } from "@/core/models";
import { memo } from "react";
import BoardCardActionActivity from "@/pages/BoardPage/components/card/action/BoardCardActionActivity";
import BoardCardActionAttachFile from "@/pages/BoardPage/components/card/action/file/BoardCardActionAttachFile";
import BoardCardActionShare from "@/pages/BoardPage/components/card/action/BoardCardActionShare";
import BoardCardActionSetLabel from "@/pages/BoardPage/components/card/action/label/BoardCardActionSetLabel";
import BoardCardActionRelationship from "@/pages/BoardPage/components/card/action/relationship/BoardCardActionRelationship";
import BoardCardActionAddChecklist from "@/pages/BoardPage/components/card/action/checklist/BoardCardActionAddChecklist";
import BoardCardActionArchive from "@/pages/BoardPage/components/card/action/BoardCardActionArchive";
import BoardCardActionDelete from "@/pages/BoardPage/components/card/action/BoardCardActionDelete";
import BoardCardActionMetadata from "@/pages/BoardPage/components/card/action/BoardCardActionMetadata";
import BoardCardActionBotScope from "@/pages/BoardPage/components/card/action/botScope/BoardCardActionBotScope";

const sharedButtonClassName = "mb-2 w-full justify-start gap-2 rounded-none px-2 py-1 sm:h-7";

export function SkeletonBoardCardActionList() {
    return (
        <>
            <Skeleton className={sharedButtonClassName} />
            <Skeleton className={sharedButtonClassName} />
            <Skeleton className={sharedButtonClassName} />
            <Skeleton className={sharedButtonClassName} />
            <Skeleton className={sharedButtonClassName} />
            <Skeleton className={sharedButtonClassName} />
        </>
    );
}

const BoardCardActionList = memo(() => {
    const { card, currentUser, hasRoleAction } = useBoardCard();
    const isAdmin = currentUser.useField("is_admin");
    const archivedAt = card.useField("archived_at");

    return (
        <>
            <BoardCardActionSetLabel buttonClassName={sharedButtonClassName} />
            <BoardCardActionBotScope buttonClassName={sharedButtonClassName} />
            <BoardCardActionRelationship buttonClassName={sharedButtonClassName} />
            <BoardCardActionAttachFile buttonClassName={sharedButtonClassName} />
            <BoardCardActionAddChecklist buttonClassName={sharedButtonClassName} />
            <BoardCardActionMetadata buttonClassName={sharedButtonClassName} />
            <BoardCardActionActivity buttonClassName={sharedButtonClassName} />
            <BoardCardActionShare buttonClassName={sharedButtonClassName} />
            {!archivedAt && (hasRoleAction(Project.ERoleAction.CardUpdate) || isAdmin) ? (
                <BoardCardActionArchive buttonClassName={sharedButtonClassName} />
            ) : null}
            {!!archivedAt && (hasRoleAction(Project.ERoleAction.CardDelete) || isAdmin) ? (
                <BoardCardActionDelete buttonClassName={sharedButtonClassName} />
            ) : null}
        </>
    );
});

export default BoardCardActionList;
