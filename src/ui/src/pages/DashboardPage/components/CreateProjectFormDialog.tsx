import { useTranslation } from "react-i18next";
import FormErrorMessage from "@/components/FormErrorMessage";
import { AutoComplete, Button, Dialog, Floating, Form, Input, SubmitButton } from "@/components/base";
import useCreateProject from "@/controllers/api/dashboard/useCreateProject";
import useForm from "@/core/hooks/form/useForm";
import { Project } from "@/core/models";
import { ROUTES } from "@/core/routing/constants";
import { useRef } from "react";
import { usePageNavigateRef } from "@/core/hooks/usePageNavigate";

export interface ICreateProjectFormDialogProps {
    opened: bool;
    setOpened: (opened: bool) => void;
}

function CreateProjectFormDialog({ opened, setOpened }: ICreateProjectFormDialogProps): React.JSX.Element {
    const [t] = useTranslation();
    const navigate = usePageNavigateRef();
    const { mutate } = useCreateProject();
    const projectTypeRef = useRef("");
    const projectTypeInputRef = useRef<HTMLInputElement>(null);
    const { errors, isValidating, handleSubmit, formRef } = useForm({
        errorLangPrefix: "project.errors",
        schema: {
            title: { required: true },
            description: {},
            project_type: { required: true },
        },
        mutate,
        mutateOnSuccess: (data) => {
            navigate(ROUTES.BOARD.MAIN(data.project_uid));
        },
        useDefaultBadRequestHandler: true,
    });

    const setProjectType = (value: string) => {
        projectTypeRef.current = value;
        projectTypeInputRef.current!.value = value;
    };

    return (
        <Dialog.Root open={opened} onOpenChange={setOpened}>
            <Dialog.Content className="sm:max-w-md" aria-describedby="">
                <Form.Root onSubmit={handleSubmit} ref={formRef}>
                    <Dialog.Header>
                        <Dialog.Title>{t("dashboard.Create New Project")}</Dialog.Title>
                    </Dialog.Header>
                    <Form.Field name="title">
                        <Floating.LabelInput
                            label={t("project.Project title")}
                            isFormControl
                            autoFocus
                            autoComplete="off"
                            className="mt-4"
                            disabled={isValidating}
                            required
                        />
                        {errors.title && <FormErrorMessage error={errors.title} icon="circle-alert" />}
                    </Form.Field>
                    <Form.Field name="description">
                        <Floating.LabelTextarea
                            label={t("project.Project description")}
                            isFormControl
                            autoComplete="off"
                            className="mt-4"
                            resize="none"
                            disabled={isValidating}
                        />
                    </Form.Field>
                    <Form.Field name="project_type">
                        <Input type="hidden" name="project_type" value={projectTypeRef.current} ref={projectTypeInputRef} />
                        <AutoComplete
                            selectedValue=""
                            onValueChange={setProjectType}
                            items={Project.TYPES.map((project_type) => ({
                                value: project_type,
                                label: t(project_type === "Other" ? "common.Other" : `project.types.${project_type}`),
                            }))}
                            emptyMessage={projectTypeRef.current ?? ""}
                            placeholder={t("project.Project type")}
                            disabled={isValidating}
                            required
                            className="mt-4"
                        />
                        {errors.project_type && <FormErrorMessage error={errors.project_type} icon="circle-alert" />}
                    </Form.Field>
                    <Dialog.Footer className="mt-6 flex-col gap-2 sm:justify-end sm:gap-0">
                        <Dialog.Close asChild>
                            <Button type="button" variant="secondary" disabled={isValidating}>
                                {t("common.Cancel")}
                            </Button>
                        </Dialog.Close>
                        <SubmitButton type="submit" isValidating={isValidating}>
                            {t("common.Create")}
                        </SubmitButton>
                    </Dialog.Footer>
                </Form.Root>
            </Dialog.Content>
        </Dialog.Root>
    );
}

export default CreateProjectFormDialog;
