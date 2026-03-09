import Checkbox from "@/components/base/Checkbox";
import Table from "@/components/base/Table";
import { IFlexProps } from "@/components/base/Flex";
import { GlobalRelationshipType } from "@/core/models";
import { ModelRegistry } from "@/core/models/ModelRegistry";
import GlobalRelationshipChildName from "@/pages/SettingsPage/components/relationships/GlobalRelationshipChildName";
import GlobalRelationshipDescription from "@/pages/SettingsPage/components/relationships/GlobalRelationshipDescription";
import GlobalRelationshipParentName from "@/pages/SettingsPage/components/relationships/GlobalRelationshipParentName";
import { memo } from "react";

export interface IGlobalRelationshipRowProps extends IFlexProps {
    globalRelationship: GlobalRelationshipType.TModel;
    selectedGlobalRelationships: string[];
    setSelectedGlobalRelationships: React.Dispatch<React.SetStateAction<string[]>>;
}

const GlobalRelationshipRow = memo(
    ({ globalRelationship, selectedGlobalRelationships, setSelectedGlobalRelationships, ...props }: IGlobalRelationshipRowProps) => {
        const toggleSelect = () => {
            setSelectedGlobalRelationships((prev) => {
                if (prev.some((value) => value === globalRelationship.uid)) {
                    return prev.filter((value) => value !== globalRelationship.uid);
                } else {
                    return [...prev, globalRelationship.uid];
                }
            });
        };

        return (
            <Table.FlexRow {...props}>
                <ModelRegistry.GlobalRelationshipType.Provider model={globalRelationship}>
                    <Table.FlexCell className="w-12 text-center">
                        <Checkbox checked={selectedGlobalRelationships.some((value) => value === globalRelationship.uid)} onClick={toggleSelect} />
                    </Table.FlexCell>
                    <GlobalRelationshipParentName />
                    <GlobalRelationshipChildName />
                    <GlobalRelationshipDescription />
                </ModelRegistry.GlobalRelationshipType.Provider>
            </Table.FlexRow>
        );
    }
);

export default GlobalRelationshipRow;
