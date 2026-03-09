import { useState } from "react";
import { useTranslation } from "react-i18next";
import Box from "@/components/base/Box";
import Button from "@/components/base/Button";
import Command from "@/components/base/Command";
import Flex from "@/components/base/Flex";
import IconComponent from "@/components/base/IconComponent";
import Popover from "@/components/base/Popover";
import Skeleton from "@/components/base/Skeleton";
import SubmitButton from "@/components/base/SubmitButton";
import Toast from "@/components/base/Toast";
import useChangePrimaryEmail from "@/controllers/api/account/useChangePrimaryEmail";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { useAccountSetting } from "@/core/providers/AccountSettingProvider";

export function SkeletonPrimaryEmailForm(): React.JSX.Element {
    const [t] = useTranslation();

    return (
        <Box>
            <h4 className="pb-2 text-lg font-semibold tracking-tight">{t("myAccount.Primary email")}</h4>
            <Flex items="center" gap="2">
                <Flex items="center" justify="between" minW="64" rounded="md" py="2" px="3" border className="whitespace-nowrap border-input">
                    <Skeleton h="4" w="full" />
                    <IconComponent icon="chevrons-up-down" size="4" className="ml-2 shrink-0 opacity-50" />
                </Flex>
                <Skeleton w="12" h="8" />
            </Flex>
        </Box>
    );
}

function PrimaryEmailForm(): React.JSX.Element {
    const { currentUser, updatedUser, isValidating, setIsValidating } = useAccountSetting();
    const [t] = useTranslation();
    const [open, setOpen] = useState(false);
    const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
    const { mutate } = useChangePrimaryEmail();

    const handleSubmit = () => {
        if (!selectedEmail) {
            Toast.Add.error(t("errors.requests.EX1002"));
            return;
        }

        if (isValidating) {
            return;
        }

        setIsValidating(true);

        mutate(
            {
                email: selectedEmail,
            },
            {
                onSuccess: () => {
                    setTimeout(() => {
                        updatedUser();
                        Toast.Add.success(t("successes.Primary email updated successfully."));
                    }, 0);
                },
                onError: (error) => {
                    const { handle } = setupApiErrorHandler({});

                    handle(error);
                },
                onSettled: () => {
                    setIsValidating(false);
                },
            }
        );
    };

    return (
        <Box>
            <h4 className="pb-2 text-lg font-semibold tracking-tight">{t("myAccount.Primary email")}</h4>
            <Flex items="center" gap="2">
                <Popover.Root open={open} onOpenChange={setOpen}>
                    <Popover.Trigger asChild>
                        <Button variant="outline" role="combobox" aria-expanded={open} className="min-w-64 justify-between" disabled={isValidating}>
                            {selectedEmail ?? currentUser.email}
                            <IconComponent icon="chevrons-up-down" size="4" className="ml-2 shrink-0 opacity-50" />
                        </Button>
                    </Popover.Trigger>
                    <Popover.Content className="min-w-64 p-0" align="start">
                        <Command.Root>
                            <Command.Input placeholder={t("myAccount.Search email...")} />
                            <Command.List>
                                <Command.Group>
                                    <Command.Item
                                        value={currentUser.email}
                                        onSelect={() => {
                                            setSelectedEmail(null);
                                            setOpen(false);
                                        }}
                                    >
                                        {!selectedEmail && <IconComponent icon="check" size="4" className="mr-2" />}
                                        {currentUser.email}
                                    </Command.Item>
                                    {currentUser.subemails.map(
                                        (subEmail) =>
                                            subEmail.verified_at && (
                                                <Command.Item
                                                    key={`email-list-${subEmail.email}`}
                                                    value={subEmail.email}
                                                    onSelect={(currentValue) => {
                                                        setSelectedEmail(currentValue);
                                                        setOpen(false);
                                                    }}
                                                >
                                                    {selectedEmail === subEmail.email && <IconComponent icon="check" size="4" className="mr-2" />}
                                                    {subEmail.email}
                                                </Command.Item>
                                            )
                                    )}
                                </Command.Group>
                            </Command.List>
                        </Command.Root>
                    </Popover.Content>
                </Popover.Root>
                <SubmitButton type="button" size="sm" onClick={handleSubmit} isValidating={isValidating}>
                    {t("common.Save")}
                </SubmitButton>
            </Flex>
        </Box>
    );
}

export default PrimaryEmailForm;
