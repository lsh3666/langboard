import { TAgentFormInput } from "@/ai/form.types";

export const getN8NInputForm = (): TAgentFormInput[] => {
    return [
        { type: "text", name: "input_key", label: "Input key", defaultValue: "input_value" },
        { type: "text", name: "output_key", label: "Output key", defaultValue: "message" },
        { type: "text", name: "file_key", label: "File key", defaultValue: "file" },
    ];
};
