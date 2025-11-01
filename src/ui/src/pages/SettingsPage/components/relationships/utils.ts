import { GlobalRelationshipType } from "@/core/models";
import { IConvertedGlobalRelationshipType, IImportExportGlobalRelationshipType } from "@/pages/SettingsPage/components/relationships/types";

export const convertImportedTypeToModel = (importedModel: IImportExportGlobalRelationshipType): IConvertedGlobalRelationshipType => {
    return {
        parent_name: importedModel.parent,
        child_name: importedModel.child,
        description: importedModel.description || "",
    };
};

export const convertModelToImportExportType = (
    model: IConvertedGlobalRelationshipType | GlobalRelationshipType.TModel
): IImportExportGlobalRelationshipType => {
    return {
        parent: model.parent_name,
        child: model.child_name,
        description: model.description,
    };
};
