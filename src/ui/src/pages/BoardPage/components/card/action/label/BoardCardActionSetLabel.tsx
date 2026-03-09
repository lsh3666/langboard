import Box from "@/components/base/Box";
import Button from "@/components/base/Button";
import Flex from "@/components/base/Flex";
import IconComponent from "@/components/base/IconComponent";
import Popover from "@/components/base/Popover";
import SubmitButton from "@/components/base/SubmitButton";
import Toast from "@/components/base/Toast";
import useUpdateCardLabels from "@/controllers/api/card/useUpdateCardLabels";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { ProjectRole } from "@/core/models/roles";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import BoardCardActionLabelList from "@/pages/BoardPage/components/card/action/label/BoardCardActionLabelList";
import { ISharedBoardCardActionProps } from "@/pages/BoardPage/components/card/action/types";
import { memo, useState } from "react";
import { useTranslation } from "react-i18next";

export interface IBoardCardActionSetLabelProps extends ISharedBoardCardActionProps {}

const BoardCardActionSetLabel = memo(({ buttonClassName }: IBoardCardActionSetLabelProps) => {
    const { projectUID, card, hasRoleAction } = useBoardCard();
    const [t] = useTranslation();
    const [isOpened, setIsOpened] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const { mutateAsync: updateCardLabelsMutateAsync } = useUpdateCardLabels({ interceptToast: true });
    const [selectedLabelUIDs, setSelectedLabelUIDs] = useState(card.labels.map((label) => label.uid));

    const changeOpenedState = (opened: bool) => {
        if (isValidating) {
            return;
        }

        if (!opened) {
            setSelectedLabelUIDs(card.labels.map((label) => label.uid));
        }
        setIsOpened(opened);
    };

    const updateLabels = () => {
        if (isValidating) {
            return;
        }

        setIsValidating(true);

        const promise = updateCardLabelsMutateAsync({
            project_uid: projectUID,
            card_uid: card.uid,
            labels: selectedLabelUIDs,
        });

        Toast.Add.promise(promise, {
            loading: t("common.Updating..."),
            error: (error) => {
                const messageRef = { message: "" };
                const { handle } = setupApiErrorHandler({}, messageRef);

                handle(error);
                return messageRef.message;
            },
            success: () => {
                return t("successes.Labels updated successfully.");
            },
            finally: () => {
                setIsValidating(false);
                setIsOpened(false);
            },
        });
    };

    if (!hasRoleAction(ProjectRole.EAction.CardUpdate)) {
        return null;
    }

    return (
        <Popover.Root modal open={isOpened} onOpenChange={changeOpenedState}>
            <Popover.Trigger asChild>
                <Button variant="secondary" className={buttonClassName}>
                    <IconComponent icon="file-up" size="4" />
                    {t("card.Set label")}
                </Button>
            </Popover.Trigger>
            <Popover.Content align="end" className="w-[min(theme(spacing.72),80vw)]">
                <Box mb="2" textSize="sm" weight="semibold">
                    {t("card.Set label")}
                </Box>
                <BoardCardActionLabelList selectedLabelUIDs={selectedLabelUIDs} setSelectedLabelUIDs={setSelectedLabelUIDs} />
                <Flex items="center" justify="end" gap="1" mt="2">
                    <Button type="button" variant="secondary" size="sm" disabled={isValidating} onClick={() => changeOpenedState(false)}>
                        {t("common.Cancel")}
                    </Button>
                    <SubmitButton type="button" size="sm" onClick={updateLabels} isValidating={isValidating}>
                        {t("common.Save")}
                    </SubmitButton>
                </Flex>
            </Popover.Content>
        </Popover.Root>
    );
});

export default BoardCardActionSetLabel;
