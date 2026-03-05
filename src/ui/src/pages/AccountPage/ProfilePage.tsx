import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import AvatarUploader from "@/components/AvatarUploader";
import FormErrorMessage from "@/components/FormErrorMessage";
import { Box, Flex, Form, Input, Label, SubmitButton, Toast } from "@/components/base";
import useUpdateProfile from "@/controllers/api/account/useUpdateProfile";
import useForm from "@/core/hooks/form/useForm";
import { Utils } from "@langboard/core/utils";
import { useAccountSetting } from "@/core/providers/AccountSettingProvider";
import { usePageHeader } from "@/core/providers/PageHeaderProvider";

function ProfilePage(): React.JSX.Element {
    const { setPageAliasRef } = usePageHeader();
    const { currentUser, updatedUser } = useAccountSetting();
    const [t] = useTranslation();
    const { mutate } = useUpdateProfile();
    const dataTransferRef = useRef(new DataTransfer());
    const isAvatarDeletedRef = useRef(false);
    const { errors, isValidating, handleSubmit, formRef, focusComponentRef } = useForm({
        errorLangPrefix: "myAccount.errors",
        schema: {
            firstname: {
                required: true,
            },
            lastname: {
                required: true,
            },
            affiliation: {},
            position: {},
            avatar: { mimeType: "image/*" },
            delete_avatar: {},
        },
        inputRefs: {
            avatar: dataTransferRef,
            delete_avatar: isAvatarDeletedRef,
        },
        mutate,
        mutateOnSuccess: () => {
            updatedUser();
            Toast.Add.success(t("successes.Profile updated successfully."));
        },
        mutateOnSettled: () => {
            if (!focusComponentRef.current) {
                return;
            }

            setTimeout(() => {
                if (Utils.Type.isElement(focusComponentRef.current)) {
                    focusComponentRef.current.focus();
                } else if (Utils.Type.isString(focusComponentRef.current)) {
                    formRef.current?.[focusComponentRef.current]?.focus();
                }
            }, 0);
        },
        useDefaultBadRequestHandler: true,
    });

    useEffect(() => {
        setPageAliasRef.current("Profile");
    }, []);

    return (
        <>
            <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight">{t("myAccount.Profile")}</h2>
            <Form.Root onSubmit={handleSubmit} ref={formRef}>
                <Flex justify="center" mt="11">
                    <AvatarUploader
                        userInitials={Utils.String.getInitials(currentUser.firstname, currentUser.lastname)}
                        initialAvatarUrl={currentUser.avatar}
                        dataTransferRef={dataTransferRef}
                        isDeletedRef={isAvatarDeletedRef}
                        isValidating={isValidating}
                        canRevertUrl
                        rootClassName="max-w-screen-xs"
                        avatarSize={{
                            initial: "3xl",
                            md: "4xl",
                        }}
                    />
                </Flex>
                <Flex
                    gap="10"
                    mt="6"
                    items={{
                        initial: "center",
                        md: "start",
                    }}
                    direction={{
                        initial: "col",
                        md: "row",
                    }}
                    justify={{
                        md: "center",
                    }}
                >
                    <Flex direction="col" gap="4" w="full" className="max-w-sm">
                        <Label display="grid" w="full" items="center" gap="1.5">
                            <Box>{t("user.Username")}</Box>
                            <Input disabled defaultValue={currentUser.username} />
                        </Label>
                        <Form.Field name="firstname">
                            <Label display="grid" w="full" items="center" gap="1.5">
                                <Box>{t("user.First Name")}</Box>
                                <Input autoComplete="firstname" isFormControl disabled={isValidating} defaultValue={currentUser.firstname} />
                            </Label>
                            {errors.firstname && <FormErrorMessage error={errors.firstname} />}
                        </Form.Field>
                        <Form.Field name="lastname">
                            <Label display="grid" w="full" items="center" gap="1.5">
                                <Box>{t("user.Last Name")}</Box>
                                <Input autoComplete="lastname" isFormControl disabled={isValidating} defaultValue={currentUser.lastname} />
                            </Label>
                            {errors.lastname && <FormErrorMessage error={errors.lastname} />}
                        </Form.Field>
                        <Form.Field name="affiliation">
                            <Label display="grid" w="full" items="center" gap="1.5">
                                <Box>{t("user.Affiliation")}</Box>
                                <Input
                                    autoComplete="affiliation"
                                    isFormControl
                                    placeholder={t("user.What organization are you affiliated with?")}
                                    disabled={isValidating}
                                    defaultValue={currentUser.affiliation}
                                />
                            </Label>
                        </Form.Field>
                        <Form.Field name="position">
                            <Label display="grid" w="full" items="center" gap="1.5">
                                <Box>{t("user.Position")}</Box>
                                <Input
                                    autoComplete="position"
                                    isFormControl
                                    placeholder={t("user.What is your position in your organization?")}
                                    disabled={isValidating}
                                    defaultValue={currentUser.position}
                                />
                            </Label>
                        </Form.Field>
                    </Flex>
                </Flex>
                <Flex items="center" justify="center" gap="8" mt="16">
                    <SubmitButton type="submit" isValidating={isValidating}>
                        {t("common.Save")}
                    </SubmitButton>
                </Flex>
            </Form.Root>
        </>
    );
}

export default ProfilePage;
