import AutoComplete from "@/components/base/AutoComplete";
import Box from "@/components/base/Box";
import Flex from "@/components/base/Flex";
import Form from "@/components/base/Form";
import Input from "@/components/base/Input";
import Label from "@/components/base/Label";
import SubmitButton from "@/components/base/SubmitButton";
import Textarea from "@/components/base/Textarea";
import FormErrorMessage from "@/components/FormErrorMessage";
import useChangeProjectDetails from "@/controllers/api/board/settings/useChangeProjectDetails";
import useForm from "@/core/hooks/form/useForm";
import { Project } from "@/core/models";
import { useBoardSettings } from "@/core/providers/BoardSettingsProvider";
import { memo, useRef } from "react";
import { useTranslation } from "react-i18next";

const BoardSettingsBasic = memo(() => {
    const { project } = useBoardSettings();
    const [t] = useTranslation();
    const { mutate } = useChangeProjectDetails(project.uid);
    const title = project.useField("title");
    const description = project.useField("description");
    const aiDescription = project.useField("ai_description");
    const projectType = project.useField("project_type");
    const projectTypeRef = useRef(projectType);
    const projectTypeInputRef = useRef<HTMLInputElement>(null);
    const { errors, isValidating, handleSubmit, formRef } = useForm({
        errorLangPrefix: "project.errors",
        schema: {
            title: { required: true },
            description: {},
            project_type: { required: true },
        },
        mutate,
        useDefaultBadRequestHandler: true,
    });

    const setProjectType = (value: string) => {
        projectTypeRef.current = value;
        projectTypeInputRef.current!.value = value;
    };

    return (
        <Flex direction="col" py="4" gap="4" items="center">
            <Form.Root className="flex w-full max-w-96 flex-col gap-3" onSubmit={handleSubmit} ref={formRef}>
                <Label display="inline-grid" items="center" gap="2" w="full">
                    <Box>{t("project.Project title")}</Box>
                    <Form.Field name="title">
                        <Form.Control asChild>
                            <Input defaultValue={title} disabled={isValidating} />
                        </Form.Control>
                    </Form.Field>
                </Label>
                {errors.title && <FormErrorMessage error={errors.title} icon="circle-alert" />}
                <Label display="inline-grid" items="center" gap="2" w="full">
                    <Box>{t("project.Project description")}</Box>
                    <Form.Field name="description">
                        <Form.Control asChild>
                            <Textarea defaultValue={description} disabled={isValidating} resize="none" className="max-h-36 min-h-36" />
                        </Form.Control>
                    </Form.Field>
                </Label>
                <Form.Field name="project_type">
                    <Label display="inline-grid" items="center" gap="2" w="full">
                        <Box>{t("project.Project type")}</Box>
                        <Input type="hidden" name="project_type" value={projectTypeRef.current} ref={projectTypeInputRef} />
                        <AutoComplete
                            selectedValue={projectType}
                            onValueChange={setProjectType}
                            items={Project.TYPES.map((project_type) => ({
                                value: project_type,
                                label: t(project_type === "Other" ? "common.Other" : `project.types.${project_type}`),
                            }))}
                            emptyMessage={projectTypeRef.current ?? ""}
                            disabled={isValidating}
                            placeholder={t("project.Project type")}
                        />
                    </Label>
                    {errors.project_type && <FormErrorMessage error={errors.project_type} icon="circle-alert" />}
                </Form.Field>
                {aiDescription && (
                    <Box>
                        <Box textSize="sm" weight="semibold" className="select-none">
                            {t("project.AI summary")}
                        </Box>
                        <Textarea value={aiDescription} disabled className="min-h-36" />
                    </Box>
                )}
                <SubmitButton type="submit" isValidating={isValidating}>
                    {t("common.Save")}
                </SubmitButton>
            </Form.Root>
        </Flex>
    );
});

export default BoardSettingsBasic;
