import Flex from "@/components/base/Flex";
import useOllamaModelStore from "@/core/stores/OllamaModelStore";
import OllamaModelTracker from "@/pages/SettingsPage/components/ollama/OllamaModelTracker";

function OllamaModelTrackingList() {
    const { pullingModels } = useOllamaModelStore();

    return (
        <Flex direction="col" gap="3">
            {Object.keys(pullingModels).map((name) => (
                <OllamaModelTracker name={name} key={name} />
            ))}
        </Flex>
    );
}

export default OllamaModelTrackingList;
