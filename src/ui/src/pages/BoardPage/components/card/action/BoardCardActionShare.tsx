import Box from "@/components/base/Box";
import Button from "@/components/base/Button";
import IconComponent from "@/components/base/IconComponent";
import Popover from "@/components/base/Popover";
import CopyInput from "@/components/CopyInput";
import { PUBLIC_UI_URL } from "@/constants";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { ROUTES } from "@/core/routing/constants";
import { ISharedBoardCardActionProps } from "@/pages/BoardPage/components/card/action/types";
import { memo } from "react";
import { useTranslation } from "react-i18next";

export interface IBoardCardActionShareProps extends ISharedBoardCardActionProps {}

const BoardCardActionShare = memo(({ buttonClassName }: IBoardCardActionShareProps) => {
    const [t] = useTranslation();
    const { projectUID, card } = useBoardCard();
    const link = `${PUBLIC_UI_URL}${ROUTES.BOARD.CARD(projectUID, card.uid)}`;

    return (
        <Popover.Root>
            <Popover.Trigger asChild>
                <Button variant="secondary" className={buttonClassName}>
                    <IconComponent icon="share" size="4" />
                    {t("card.Share")}
                </Button>
            </Popover.Trigger>
            <Popover.Content align="end">
                <Box mb="2" textSize="sm" weight="semibold">
                    {t("card.Share this card")}
                </Box>
                <CopyInput value={link} />
            </Popover.Content>
        </Popover.Root>
    );
});

export default BoardCardActionShare;
