export interface IMcpToolGroupListItemContextParams {
    viewGroupUID?: string;
    setViewGroupUID: React.Dispatch<React.SetStateAction<string | undefined>>;
    selectedGroups: string[];
    setSelectedGroups: React.Dispatch<React.SetStateAction<string[]>>;
}
