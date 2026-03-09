import Flex from "@/components/base/Flex";
import useOllamaModelStore from "@/core/stores/OllamaModelStore";
import OllamaModelListItem from "@/pages/SettingsPage/components/ollama/OllamaModelListItem";

function OllamaModelList() {
    const { models } = useOllamaModelStore();

    return (
        <Flex direction="col" gap="3">
            {Object.values(models).map((model) => (
                <OllamaModelListItem key={model.name} name={model.name} />
            ))}
        </Flex>
    );
}

export default OllamaModelList;
