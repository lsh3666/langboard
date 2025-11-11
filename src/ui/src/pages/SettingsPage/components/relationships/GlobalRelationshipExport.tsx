import { Button, DropdownMenu, IconComponent } from "@/components/base";
import { GlobalRelationshipType } from "@/core/models";
import { useAppSetting } from "@/core/providers/AppSettingProvider";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import Papa from "papaparse";
import { convertModelToImportExportType } from "@/pages/SettingsPage/components/relationships/utils";

function GlobalRelationshipExport() {
    const [t] = useTranslation();
    const [isOpened, setIsOpened] = useState(false);
    const { isValidating } = useAppSetting();
    const globalRelationships = GlobalRelationshipType.Model.useModels(() => true);

    const exportToCSV = () => {
        const content = Papa.unparse(
            globalRelationships.map((relationship) => [relationship.parent_name, relationship.child_name, relationship.description])
        );

        download("csv", content, "text/csv;charset=utf-8;");
    };

    const exportToJSON = () => {
        const content = JSON.stringify(globalRelationships.map(convertModelToImportExportType), null, 2);

        download("json", content, "application/json");
    };

    const download = (extension: string, content: string, contentType: string) => {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `global_relationships.${extension}`;
        a.click();
    };

    return (
        <DropdownMenu.Root modal open={isOpened} onOpenChange={setIsOpened}>
            <DropdownMenu.Trigger asChild>
                <Button variant="outline" disabled={isValidating} className="gap-2 pl-2 pr-3">
                    <IconComponent icon="download" size="4" />
                    {t("settings.Export")}
                </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end">
                <DropdownMenu.Group>
                    <DropdownMenu.Item onClick={exportToCSV}>{t("settings.Export to CSV")}</DropdownMenu.Item>
                    <DropdownMenu.Item onClick={exportToJSON}>{t("settings.Export to JSON")}</DropdownMenu.Item>
                </DropdownMenu.Group>
            </DropdownMenu.Content>
        </DropdownMenu.Root>
    );
}

export default GlobalRelationshipExport;
