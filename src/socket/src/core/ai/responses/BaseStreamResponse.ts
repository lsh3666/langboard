/* eslint-disable @typescript-eslint/no-explicit-any */
import { AI_REQUEST_TIMEOUT, AI_REQUEST_TRIALS } from "@/Constants";
import { api } from "@/core/helpers/Api";
import Logger from "@/core/utils/Logger";
import { Utils } from "@langboard/core/utils";
import { AxiosResponse } from "axios";

export interface IStreamRespuestParams {
    url: string;
    headers?: Record<string, any>;
    body: Record<string, any>;
    signal?: AbortSignal;
    onEnd?: () => void;
    settings?: Record<string, any>;
}

export interface IStreamResponseCallbackMap {
    onMessage?: (message: string) => void | Promise<void>;
    onEnd?: () => void | Promise<void>;
    onError?: (error: Error) => void | Promise<void>;
}

abstract class BaseStreamResponse {
    protected registeredCallbacks: IStreamResponseCallbackMap;
    protected retried: number;

    constructor(protected params: IStreamRespuestParams) {
        this.registeredCallbacks = {};
        this.retried = 0;
    }

    public onMessage(callback: (message: string) => void | Promise<void>): this {
        this.registeredCallbacks.onMessage = callback;
        return this;
    }

    public onEnd(callback: () => void | Promise<void>): this {
        this.registeredCallbacks.onEnd = callback;
        return this;
    }

    public onError(callback: (error: Error) => void | Promise<void>): this {
        this.registeredCallbacks.onError = callback;
        return this;
    }

    public addCallbacks(callbacks: IStreamResponseCallbackMap): this {
        this.registeredCallbacks = callbacks;
        return this;
    }

    public async stream(): Promise<void> {
        const { signal, onEnd, settings } = this.params;
        const { onMessage, onEnd: onStreamEnd, onError } = this.registeredCallbacks;
        if (signal?.aborted) {
            return;
        }

        const result = await this.#createApi();
        if (!result || signal?.aborted) {
            return;
        }

        try {
            const bufferedChunks: string[] = [];
            const textDecoder = new TextDecoder();

            let isEndedGracefully = false;
            const endStream = async (error?: Error) => {
                isEndedGracefully = true;
                if (!signal?.aborted && !error && bufferedChunks.length) {
                    const allString = bufferedChunks.splice(0).join("");
                    let jsonChunk: Record<string, any>;
                    try {
                        jsonChunk = Utils.Json.Parse(allString);
                    } catch (e) {
                        return;
                    }

                    const parsedMessage = this.parseResponseChunk(jsonChunk, settings);
                    if (Utils.Type.isString(parsedMessage)) {
                        await onMessage?.(parsedMessage);
                    }
                }

                bufferedChunks.splice(0);

                if (error) {
                    if (!signal?.aborted) {
                        await onError?.(error);
                    }
                } else {
                    await onStreamEnd?.();
                }
                onEnd?.();

                result.data.removeAllListeners("data");
                result.data.removeAllListeners("end");
                result.data.removeAllListeners("error");
            };

            if (signal) {
                const abortEvent = async () => {
                    await endStream();
                    signal.removeEventListener("abort", abortEvent);
                };

                signal.addEventListener("abort", abortEvent);
            }

            result.data
                .on("data", async (chunk) => {
                    const chunkString = textDecoder.decode(chunk);
                    if (!chunkString.trim()) {
                        return;
                    }

                    const splitChunks = chunkString.split("\n\n");
                    for (let i = 0; i < splitChunks.length; ++i) {
                        const chunk = splitChunks[i];
                        if (!chunk.endsWith("}")) {
                            bufferedChunks.push(chunk);
                            continue;
                        }

                        let jsonChunk: Record<string, any>;
                        try {
                            jsonChunk = Utils.Json.Parse(`${bufferedChunks.join("")}${chunk}`);
                        } catch (e) {
                            bufferedChunks.push(chunk);
                            continue;
                        }

                        bufferedChunks.splice(0);

                        const parsedMessage = this.parseResponseChunk(jsonChunk);
                        if (Utils.Type.isUndefined(parsedMessage)) {
                            continue;
                        }

                        if (Utils.Type.isString(parsedMessage)) {
                            await onMessage?.(parsedMessage);
                            continue;
                        }

                        if (!Utils.Type.isObject(parsedMessage)) {
                            continue;
                        }

                        if (parsedMessage.error) {
                            await endStream(new Error(`Langflow stream error: ${parsedMessage.error}`));
                            break;
                        }

                        if (parsedMessage.end) {
                            await endStream();
                            break;
                        }
                    }
                })
                .on("end", endStream)
                .on("error", endStream)
                .on("close", async () => {
                    result.data.removeAllListeners("close");
                    if (isEndedGracefully) {
                        return;
                    }

                    await endStream();
                });
        } catch (error) {
            Logger.error(error);
            if (signal?.aborted) {
                return;
            }

            await onError?.(
                Utils.Type.isError(error) ? error : new Error("An unknown error occurred while processing the Langflow stream response.")
            );
            onEnd?.();
        }
    }

    public abstract parseResponseChunk(chunk: any, settings?: Record<string, any>): string | { end?: true; error?: any } | undefined;

    async #createApi(): Promise<AxiosResponse<NodeJS.ReadableStream, any> | null> {
        const { url, headers, body, signal } = this.params;

        let result: AxiosResponse<NodeJS.ReadableStream, any> | null = null;
        try {
            result = await api.post<NodeJS.ReadableStream>(url, body, {
                headers,
                responseType: "stream",
                timeout: AI_REQUEST_TIMEOUT * 1000,
                signal,
            });
        } catch (error) {
            result = null;
            if (this.retried < AI_REQUEST_TRIALS) {
                ++this.retried;
                return this.#createApi();
            }

            Logger.error(error);
        }

        return result;
    }
}

export default BaseStreamResponse;
