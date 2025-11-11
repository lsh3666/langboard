/* eslint-disable @typescript-eslint/no-explicit-any */
import BaseStreamResponse from "@/core/ai/responses/BaseStreamResponse";

export class LangflowStreamResponse extends BaseStreamResponse {
    public parseResponseChunk(chunk: Record<string, any>): string | { end?: true; error?: any } | undefined {
        if (!chunk.event || !chunk.data) {
            return undefined;
        }

        const { event, data } = chunk;

        switch (event) {
            case "add_message":
                if (data.sender && data.sender.toLowerCase() === "user") {
                    return undefined;
                } else {
                    return data.text;
                }
            case "token":
                if (data.token) {
                    return data.chunk;
                }
                break;
            case "error":
                return { error: data };
            case "end":
                return { end: true };
        }

        return undefined;
    }
}
