import { Button, Flex, Input, Popover, Select, SubmitButton, Toast } from "@/components/base";
import UserAvatar from "@/components/UserAvatar";
import { useUserAvatar } from "@/components/UserAvatar/Provider";
import useCreateCard from "@/controllers/api/board/useCreateCard";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { Project, ProjectColumn, User } from "@/core/models";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export interface IUserAvatarUserCreateAssignedCardActionProps {
    user: User.TModel;
    project: Project.TModel;
}

function UserAvatarUserCreateAssignedCardAction({ user, project }: IUserAvatarUserCreateAssignedCardActionProps): JSX.Element {
    const { getAvatarHoverCardAttrs } = useUserAvatar();
    const [t] = useTranslation();
    const columns = ProjectColumn.Model.useModels((model) => project.uid === model.project_uid && !model.is_archive, [project]);
    const containerRef = useRef<HTMLDivElement>(null);
    const columnUidValueRef = useRef("");
    const columnUidButtonRef = useRef<HTMLButtonElement>(null);
    const titleInputRef = useRef<HTMLInputElement>(null);
    const [isOpened, setIsOpened] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const { mutateAsync: createCardMutateAsync } = useCreateCard({ interceptToast: true });

    const createCard = () => {
        if (isValidating) {
            return;
        }

        setIsValidating(true);

        if (!columnUidValueRef.current) {
            setIsValidating(false);
            columnUidButtonRef.current?.focus();
            return;
        }

        if (!titleInputRef.current?.value) {
            setIsValidating(false);
            titleInputRef.current?.focus();
            return;
        }

        const promise = createCardMutateAsync({
            project_uid: project.uid,
            project_column_uid: columnUidValueRef.current,
            title: titleInputRef.current.value,
            assign_users: [user.uid],
        });

        Toast.Add.promise(promise, {
            loading: t("common.Adding..."),
            error: (error) => {
                const messageRef = { message: "" };
                const { handle } = setupApiErrorHandler({}, messageRef);

                handle(error);
                return messageRef.message;
            },
            success: (data) => {
                const openCard = () => {
                    const card = document.getElementById(`board-card-${data.uid}`);
                    if (!card) {
                        return setTimeout(openCard, 50);
                    }

                    card.click();
                };
                openCard();
                return t("successes.Card added successfully.");
            },
            finally: () => {
                setIsValidating(false);
            },
        });
    };

    return (
        <Popover.Root modal={false} open={isOpened} onOpenChange={setIsOpened}>
            <Popover.Trigger asChild>
                <UserAvatar.ListItem>{t("common.avatarActions.Create & assign a card")}</UserAvatar.ListItem>
            </Popover.Trigger>
            <Popover.Content className="z-[999999]" ref={containerRef} {...getAvatarHoverCardAttrs()}>
                <Select.Root onValueChange={(value) => (columnUidValueRef.current = value)} {...getAvatarHoverCardAttrs()}>
                    <Select.Trigger ref={columnUidButtonRef}>
                        <Select.Value placeholder={t("common.avatarActions.Select a column")} />
                    </Select.Trigger>
                    <Select.Content className="z-[999999]" container={containerRef.current} {...getAvatarHoverCardAttrs()}>
                        {columns.map((column) => (
                            <Select.Item key={column.uid} value={column.uid}>
                                {column.name}
                            </Select.Item>
                        ))}
                    </Select.Content>
                </Select.Root>
                <Input placeholder={t("common.avatarActions.Card title")} className="mt-2" ref={titleInputRef} />
                <Flex items="center" justify="end" gap="1" mt="2">
                    <Button type="button" variant="secondary" onClick={() => setIsOpened(false)} size="sm" disabled={isValidating}>
                        {t("common.Cancel")}
                    </Button>
                    <SubmitButton type="button" size="sm" onClick={createCard} isValidating={isValidating}>
                        {t("common.Save")}
                    </SubmitButton>
                </Flex>
            </Popover.Content>
        </Popover.Root>
    );
}

export default UserAvatarUserCreateAssignedCardAction;
