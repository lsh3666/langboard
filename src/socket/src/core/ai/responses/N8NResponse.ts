/* eslint-disable @typescript-eslint/no-explicit-any */
import BaseStreamResponse from "@/core/ai/responses/BaseStreamResponse";

export class N8NStreamResponse extends BaseStreamResponse {
    public parseResponseChunk(chunk: Record<string, any>, settings?: Record<string, any>): string | { end?: true; error?: any } | undefined {
        return parseN8NResponse(chunk, settings);
    }
}

export const parseN8NResponse = (chunk: Record<string, any>, settings?: Record<string, any>): string | undefined => {
    const outputKey = settings?.output_key ?? "message";
    if (!chunk[outputKey]) {
        return undefined;
    }

    return chunk[outputKey];
};
