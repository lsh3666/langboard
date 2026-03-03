import { Box, Button, Dialog, IconComponent } from "@/components/base";
import { MetadataList } from "@/components/MetadataList";
import MetadataAddButton from "@/components/MetadataList/MetadataAddButton";
import { ProjectRole } from "@/core/models/roles";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { ISharedBoardCardActionProps } from "@/pages/BoardPage/components/card/action/types";
import { memo, useState } from "react";
import { useTranslation } from "react-i18next";

export interface IBoardCardActionMetadataProps extends ISharedBoardCardActionProps {}

const BoardCardActionMetadata = memo(({ buttonClassName }: IBoardCardActionMetadataProps) => {
    const { projectUID, card, hasRoleAction } = useBoardCard();
    const [t] = useTranslation();
    const [isOpened, setIsOpened] = useState(false);
    const errorsMap = () => ({});

    return (
        <Dialog.Root modal open={isOpened} onOpenChange={setIsOpened}>
            <Dialog.Trigger asChild>
                <Button variant="secondary" className={buttonClassName}>
                    <IconComponent icon="file-up" size="4" />
                    {t("metadata.Metadata")}
                </Button>
            </Dialog.Trigger>
            <Dialog.Content>
                <Dialog.Title>{t("metadata.Metadata")}</Dialog.Title>
                <Dialog.Description asChild className="text-base text-primary-foreground">
                    <Box>
                        <MetadataList
                            form={{
                                type: "card",
                                project_uid: projectUID,
                                uid: card.uid,
                            }}
                            errorsMap={errorsMap}
                            canEdit={() => hasRoleAction(ProjectRole.EAction.CardUpdate)}
                        />
                    </Box>
                </Dialog.Description>
                {hasRoleAction(ProjectRole.EAction.CardUpdate) && (
                    <Dialog.Footer>
                        <MetadataAddButton
                            form={{
                                type: "card",
                                project_uid: projectUID,
                                uid: card.uid,
                            }}
                            errorsMap={errorsMap}
                        />
                    </Dialog.Footer>
                )}
            </Dialog.Content>
        </Dialog.Root>
    );
});

export default BoardCardActionMetadata;
