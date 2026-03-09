import Box from "@/components/base/Box";
import Dialog from "@/components/base/Dialog";
import { MetadataList } from "@/components/MetadataList";
import MetadataAddButton from "@/components/MetadataList/MetadataAddButton";
import { ROUTES } from "@/core/routing/constants";
import { memo } from "react";
import { useTranslation } from "react-i18next";
import { usePageNavigateRef } from "@/core/hooks/usePageNavigate";

const WikiMetadataDialog = memo(() => {
    const navigate = usePageNavigateRef();
    const [t] = useTranslation();
    const [projectUID, _, wikiUID] = location.pathname.split("/").slice(2);
    const errorsMap = () => ({});

    const close = () => {
        navigate(ROUTES.BOARD.WIKI_PAGE(projectUID, wikiUID));
    };

    return (
        <Dialog.Root open={true} onOpenChange={close}>
            <Dialog.Content>
                <Dialog.Title>{t("metadata.Metadata")}</Dialog.Title>
                <Dialog.Description asChild className="text-base text-primary-foreground">
                    <Box>
                        <MetadataList
                            form={{
                                type: "project_wiki",
                                project_uid: projectUID,
                                uid: wikiUID,
                            }}
                            errorsMap={errorsMap}
                            canEdit={() => true}
                        />
                    </Box>
                </Dialog.Description>
                <Dialog.Footer>
                    <MetadataAddButton
                        form={{
                            type: "project_wiki",
                            project_uid: projectUID,
                            uid: wikiUID,
                        }}
                        errorsMap={errorsMap}
                    />
                </Dialog.Footer>
            </Dialog.Content>
        </Dialog.Root>
    );
});

export default WikiMetadataDialog;
