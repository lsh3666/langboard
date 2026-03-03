import { useTranslation } from "react-i18next";
import { Box, Button, Dialog, Floating, SubmitButton, Toast } from "@/components/base";
import { useRef, useState } from "react";
import useCreateGlobalRelationship from "@/controllers/api/settings/relationships/useCreateGlobalRelationship";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { ROUTES } from "@/core/routing/constants";
import FormErrorMessage from "@/components/FormErrorMessage";
import { usePageNavigateRef } from "@/core/hooks/usePageNavigate";
import { EHttpStatus } from "@langboard/core/enums";
import { ISharedSettingsModalProps } from "@/pages/SettingsPage/types";

function GlobalRelationshipCreateFormDialog({ opened, setOpened }: ISharedSettingsModalProps): JSX.Element {
    const [t] = useTranslation();
    const navigate = usePageNavigateRef();
    const [isValidating, setIsValidating] = useState(false);
    const dataTransferRef = useRef(new DataTransfer());
    const parentNameInputRef = useRef<HTMLInputElement>(null);
    const childNameInputRef = useRef<HTMLInputElement>(null);
    const descriptionInputRef = useRef<HTMLInputElement>(null);
    const { mutate } = useCreateGlobalRelationship();
    const [errors, setErrors] = useState<Record<string, string>>({});
    const save = () => {
        if (isValidating || !parentNameInputRef.current || !childNameInputRef.current || !descriptionInputRef.current) {
            return;
        }

        setIsValidating(true);

        const parentValue = parentNameInputRef.current.value.trim();
        const childValue = childNameInputRef.current.value.trim();
        const descriptionValue = descriptionInputRef.current.value.trim();
        const newErrors: Record<string, string> = {};
        let focusableInput: HTMLInputElement | null = null;

        if (!parentValue) {
            newErrors.parentName = t("settings.errors.missing.parent_name");
            focusableInput = parentNameInputRef.current;
        }

        if (!childValue) {
            newErrors.childName = t("settings.errors.missing.child_name");
            if (!focusableInput) {
                focusableInput = childNameInputRef.current;
            }
        }

        if (Object.keys(newErrors).length) {
            setErrors(newErrors);
            setIsValidating(false);
            focusableInput?.focus();
            return;
        }

        mutate(
            {
                parent_name: parentValue,
                child_name: childValue,
                description: descriptionValue,
            },
            {
                onSuccess: () => {
                    Toast.Add.success(t("successes.Global relationship type created successfully."));
                    if (dataTransferRef.current.items.length) {
                        dataTransferRef.current.items.clear();
                    }
                    if (parentNameInputRef.current) {
                        parentNameInputRef.current.value = "";
                    }
                    if (childNameInputRef.current) {
                        childNameInputRef.current.value = "";
                    }
                    if (descriptionInputRef.current) {
                        descriptionInputRef.current.value = "";
                    }
                    setOpened(false);
                },
                onError: (error) => {
                    const { handle } = setupApiErrorHandler({
                        [EHttpStatus.HTTP_403_FORBIDDEN]: {
                            after: () => navigate(ROUTES.ERROR(EHttpStatus.HTTP_403_FORBIDDEN), { replace: true }),
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

    const changeOpenedState = (opened: bool) => {
        if (isValidating) {
            return;
        }

        setOpened(opened);
    };

    return (
        <Dialog.Root open={opened} onOpenChange={changeOpenedState}>
            <Dialog.Content className="sm:max-w-md" aria-describedby="">
                <Dialog.Header>
                    <Dialog.Title>{t("settings.Create global relationship type")}</Dialog.Title>
                </Dialog.Header>
                <Box mt="4">
                    <Floating.LabelInput
                        label={t("settings.Parent name")}
                        autoFocus
                        autoComplete="off"
                        disabled={isValidating}
                        required
                        ref={parentNameInputRef}
                    />
                    {errors.parentName && <FormErrorMessage error={errors.parentName} notInForm />}
                </Box>
                <Box mt="4">
                    <Floating.LabelInput
                        label={t("settings.Child name")}
                        autoComplete="off"
                        disabled={isValidating}
                        required
                        ref={childNameInputRef}
                    />
                    {errors.childName && <FormErrorMessage error={errors.childName} notInForm />}
                </Box>
                <Box mt="4">
                    <Floating.LabelInput label={t("settings.Description")} autoComplete="off" disabled={isValidating} ref={descriptionInputRef} />
                </Box>
                <Dialog.Footer className="mt-6 flex-col gap-2 sm:justify-end sm:gap-0">
                    <Dialog.Close asChild>
                        <Button type="button" variant="secondary" disabled={isValidating}>
                            {t("common.Cancel")}
                        </Button>
                    </Dialog.Close>
                    <SubmitButton type="button" isValidating={isValidating} onClick={save}>
                        {t("common.Create")}
                    </SubmitButton>
                </Dialog.Footer>
            </Dialog.Content>
        </Dialog.Root>
    );
}

export default GlobalRelationshipCreateFormDialog;
