import { useTranslation } from "react-i18next";
import { Fragment } from "react/jsx-runtime";
import Badge from "@/components/base/Badge";
import Box from "@/components/base/Box";
import Card from "@/components/base/Card";
import Flex from "@/components/base/Flex";
import IconComponent from "@/components/base/IconComponent";
import Separator from "@/components/base/Separator";
import Skeleton from "@/components/base/Skeleton";
import SubmitButton from "@/components/base/SubmitButton";
import Toast from "@/components/base/Toast";
import useAddNewEmail from "@/controllers/api/account/useAddNewEmail";
import useDeleteSubEmail from "@/controllers/api/account/useDeleteSubEmail";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { useAccountSetting } from "@/core/providers/AccountSettingProvider";
import { EHttpStatus } from "@langboard/core/enums";

export function SkeletonEmails(): React.JSX.Element {
    return (
        <Box>
            <Flex gap="3" p="3">
                <Skeleton h="6" w="16" />
                <Skeleton h="6" className="w-1/3" />
            </Flex>
            <Separator />
            <Flex items="center" justify="between" p="3">
                <Flex gap="3" w="full">
                    <Skeleton h="6" w="16" />
                    <Skeleton h="6" className="w-1/3" />
                </Flex>
                <Skeleton size="8" />
            </Flex>
        </Box>
    );
}

function EmailList(): React.JSX.Element {
    const { currentUser, updatedUser, isValidating, setIsValidating } = useAccountSetting();
    const [t] = useTranslation();
    const { mutate: deleteSubEmailMutate } = useDeleteSubEmail();
    const { mutate: resendNewEmailLinkMutate } = useAddNewEmail();

    const handleSubmit = (email: string) => {
        if (isValidating) {
            return;
        }

        setIsValidating(true);

        deleteSubEmailMutate(
            { email },
            {
                onSuccess: () => {
                    updatedUser();
                    Toast.Add.success(t("successes.Email deleted successfully."));
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

    const handleResend = (email: string) => {
        if (isValidating) {
            return;
        }

        setIsValidating(true);

        resendNewEmailLinkMutate(
            { is_resend: true, new_email: email },
            {
                onSuccess: () => {
                    Toast.Add.success(t("successes.Please check your inbox to verify your email."));
                },
                onError: (error) => {
                    const { handle } = setupApiErrorHandler({
                        [EHttpStatus.HTTP_304_NOT_MODIFIED]: {
                            after: () => updatedUser(),
                        },
                    });

                    handle(error);
                },
                onSettled: () => {
                    setIsValidating(false);
                },
            }
        );
    };

    return (
        <Card.Root>
            <Card.Content className="p-0">
                <Flex gap="3" p="3">
                    <Badge>{t("myAccount.Primary")}</Badge>
                    <span>{currentUser.email}</span>
                </Flex>
                {currentUser.subemails.map((subEmail) => (
                    <Fragment key={`email-list-${subEmail.email}`}>
                        <Separator />
                        <Flex items="center" justify="between" p="3">
                            <Flex gap="3">
                                <Badge variant="secondary">{t(`myAccount.${subEmail.verified_at ? "Sub" : "Unverified"}`)}</Badge>
                                <span>{subEmail.email}</span>
                            </Flex>
                            <Flex gap="3">
                                {!subEmail.verified_at && (
                                    <SubmitButton
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => handleResend(subEmail.email)}
                                        isValidating={isValidating}
                                    >
                                        {t("myAccount.Resend")}
                                    </SubmitButton>
                                )}
                                <SubmitButton
                                    type="button"
                                    variant="destructive"
                                    size="icon-sm"
                                    onClick={() => handleSubmit(subEmail.email)}
                                    isValidating={isValidating}
                                >
                                    <IconComponent icon="trash-2" size="4" />
                                </SubmitButton>
                            </Flex>
                        </Flex>
                    </Fragment>
                ))}
            </Card.Content>
        </Card.Root>
    );
}

export default EmailList;
