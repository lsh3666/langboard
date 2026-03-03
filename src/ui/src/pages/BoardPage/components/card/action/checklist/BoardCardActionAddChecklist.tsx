import { Button, Flex, Floating, IconComponent, Popover, SubmitButton, Toast } from "@/components/base";
import useCreateCardChecklist from "@/controllers/api/card/checklist/useCreateCardChecklist";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { ProjectRole } from "@/core/models/roles";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { ISharedBoardCardActionProps } from "@/pages/BoardPage/components/card/action/types";
import { memo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export interface IBoardCardActionAddChecklistProps extends ISharedBoardCardActionProps {}

const BoardCardActionAddChecklist = memo(({ buttonClassName }: IBoardCardActionAddChecklistProps) => {
    const { projectUID, card, hasRoleAction } = useBoardCard();
    const [t] = useTranslation();
    const [isOpened, setIsOpened] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const titleInputRef = useRef<HTMLInputElement>(null);
    const { mutateAsync: createChecklistMutateAsync } = useCreateCardChecklist({ interceptToast: true });

    const changeOpenedState = (opened: bool) => {
        if (isValidating) {
            return;
        }
        setIsOpened(opened);
    };

    const save = () => {
        if (isValidating || !titleInputRef.current) {
            return;
        }

        setIsValidating(true);

        const titleValue = titleInputRef.current.value.trim();
        if (!titleValue) {
            setIsValidating(false);
            titleInputRef.current.focus();
            return;
        }

        const promise = createChecklistMutateAsync({
            project_uid: projectUID,
            card_uid: card.uid,
            title: titleInputRef.current?.value,
        });

        Toast.Add.promise(promise, {
            loading: t("common.Adding..."),
            error: (error) => {
                const messageRef = { message: "" };
                const { handle } = setupApiErrorHandler({}, messageRef);

                handle(error);
                return messageRef.message;
            },
            success: () => {
                return t("successes.Checklist added successfully.");
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
        <Popover.Root
            modal
            open={isOpened}
            onOpenChange={(opened) => {
                if (isValidating) {
                    return;
                }
                changeOpenedState(opened);
            }}
        >
            <Popover.Trigger asChild>
                <Button variant="secondary" className={buttonClassName}>
                    <IconComponent icon="list-todo" size="4" />
                    {t("card.Add checklist")}
                </Button>
            </Popover.Trigger>
            <Popover.Content align="end" className="w-[min(theme(spacing.96),80vw)]">
                <Floating.LabelInput label={t("card.Checklist title")} autoFocus defaultValue={""} disabled={isValidating} ref={titleInputRef} />
                <Flex items="center" justify="end" gap="1" mt="2">
                    <Button type="button" variant="secondary" size="sm" disabled={isValidating} onClick={() => changeOpenedState(false)}>
                        {t("common.Cancel")}
                    </Button>
                    <SubmitButton type="button" size="sm" onClick={save} isValidating={isValidating}>
                        {t("common.Save")}
                    </SubmitButton>
                </Flex>
            </Popover.Content>
        </Popover.Root>
    );
});

export default BoardCardActionAddChecklist;
