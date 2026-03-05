import { Box, Button, Flex, Popover, SubmitButton, Toast } from "@/components/base";
import UserAvatar from "@/components/UserAvatar";
import { useUserAvatar } from "@/components/UserAvatar/Provider";
import useUnassignProjectAssignee from "@/controllers/api/board/useUnassignProjectAssignee";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { Project } from "@/core/models";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export interface IUserAvatarUserUnassignActionProps {
    project: Project.TModel;
    setIsAssignee: React.Dispatch<React.SetStateAction<bool>>;
}

function UserAvatarUserUnassignAction({ project, setIsAssignee }: IUserAvatarUserUnassignActionProps): React.JSX.Element {
    const { userOrBot, getAvatarHoverCardAttrs } = useUserAvatar();
    const [t] = useTranslation();
    const [isOpened, setIsOpened] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const { mutateAsync: unassignProjectAssigneeMutateAsync } = useUnassignProjectAssignee({ interceptToast: true });

    const unassign = () => {
        if (isValidating) {
            return;
        }

        setIsValidating(true);

        const promise = unassignProjectAssigneeMutateAsync({
            project_uid: project.uid,
            assignee_uid: userOrBot.uid,
        });

        Toast.Add.promise(promise, {
            loading: t("common.Deleting..."),
            error: (error) => {
                const messageRef = { message: "" };
                const { handle } = setupApiErrorHandler({}, messageRef);

                handle(error);
                return messageRef.message;
            },
            success: () => {
                setIsAssignee(() => false);
                return t("successes.Unassigned successfully.");
            },
            finally: () => {
                setIsValidating(false);
            },
        });
    };

    return (
        <Popover.Root modal={false} open={isOpened} onOpenChange={setIsOpened}>
            <Popover.Trigger asChild>
                <UserAvatar.ListItem>{t("common.avatarActions.Unassign from this project")}</UserAvatar.ListItem>
            </Popover.Trigger>
            <Popover.Content className="z-[999999]" {...getAvatarHoverCardAttrs()}>
                <Box mb="1" textSize={{ initial: "sm", sm: "base" }} weight="semibold" className="text-center">
                    {t("ask.Are you sure you want to unassign this assignee?")}
                </Box>
                <Box maxW="full" textSize="sm" weight="bold" className="text-center text-red-500">
                    {t("common.deleteDescriptions.All data will be lost.")}
                </Box>
                <Box maxW="full" textSize="sm" weight="bold" className="text-center text-red-500">
                    {t("common.deleteDescriptions.This action cannot be undone.")}
                </Box>
                <Flex items="center" justify="end" gap="1" mt="2">
                    <Button type="button" variant="secondary" onClick={() => setIsOpened(false)} size="sm" disabled={isValidating}>
                        {t("common.Cancel")}
                    </Button>
                    <SubmitButton type="button" variant="destructive" size="sm" onClick={unassign} isValidating={isValidating}>
                        {t("common.Delete")}
                    </SubmitButton>
                </Flex>
            </Popover.Content>
        </Popover.Root>
    );
}

export default UserAvatarUserUnassignAction;
