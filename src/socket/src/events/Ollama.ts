/* eslint-disable @typescript-eslint/no-explicit-any */
import EventManager from "@/core/server/EventManager";
import { EHttpStatus, ESocketTopic } from "@langboard/core/enums";
import { Utils } from "@langboard/core/utils";
import { OLLAMA_API_URL } from "@/Constants";
import axios, { isAxiosError } from "axios";
import Subscription from "@/core/server/Subscription";
import Logger from "@/core/utils/Logger";
import Cache from "@/core/caching/Cache";
import { SocketEvents } from "@langboard/core/constants";

const OLLAMA_PULLING_MODELS_CACHE_KEY = "ollama:pulling:models";
const ollamaApi = axios.create({
    baseURL: OLLAMA_API_URL,
});

const setPullingModels = async ({ model, toggle, skipIfExists }: { model: string; toggle: bool; skipIfExists: bool }) => {
    const pullingModels = (await Cache.get<Record<string, bool>>(OLLAMA_PULLING_MODELS_CACHE_KEY)) || {};
    if (skipIfExists && pullingModels[model]) {
        return false;
    }

    if (toggle) {
        pullingModels[model] = true;
    } else {
        delete pullingModels[model];
    }

    await Cache.set(OLLAMA_PULLING_MODELS_CACHE_KEY, pullingModels, 24 * 60 * 60);
    return true;
};

EventManager.on(ESocketTopic.OllamaManager, SocketEvents.CLIENT.SETTINGS.OLLAMA.COPY_MODEL, async ({ topicId, data }) => {
    const model = data.model;
    const copyTo = data.copy_to;
    if (!OLLAMA_API_URL || !Utils.Type.isString(model) || !Utils.Type.isString(copyTo)) {
        return;
    }

    try {
        await ollamaApi.post("/api/copy", { data: { source: model, destination: copyTo } });
        await Subscription.publish(ESocketTopic.OllamaManager, topicId, SocketEvents.SERVER.SETTINGS.OLLAMA.MODEL_COPIED, { model, copy_to: copyTo });
    } catch (error) {
        Logger.error(error, "\n");
    }
});

EventManager.on(ESocketTopic.OllamaManager, SocketEvents.CLIENT.SETTINGS.OLLAMA.DELETE_MODEL, async ({ topicId, data }) => {
    const model = data.model;
    if (!OLLAMA_API_URL || !Utils.Type.isString(model)) {
        return;
    }

    try {
        await ollamaApi.delete("/api/delete", { data: { model } });
        await Subscription.publish(ESocketTopic.OllamaManager, topicId, SocketEvents.SERVER.SETTINGS.OLLAMA.MODEL_DELETED, { model });
    } catch (error) {
        Logger.error(error, "\n");
        if (isAxiosError(error)) {
            if (error.status === EHttpStatus.HTTP_404_NOT_FOUND) {
                await Subscription.publish(ESocketTopic.OllamaManager, topicId, SocketEvents.SERVER.SETTINGS.OLLAMA.MODEL_DELETED, { model });
            }
        }
    }
});

EventManager.on(ESocketTopic.OllamaManager, SocketEvents.CLIENT.SETTINGS.OLLAMA.PULL_MODEL, async ({ topicId, data }) => {
    const model = data.model;
    if (!OLLAMA_API_URL || !Utils.Type.isString(model)) {
        return;
    }

    if (!(await setPullingModels({ model, toggle: true, skipIfExists: true }))) {
        return;
    }

    try {
        const result = await ollamaApi.post<NodeJS.ReadableStream>(
            "/api/pull",
            { model, stream: true },
            {
                responseType: "stream",
            }
        );

        const bufferedChunks: string[] = [];
        const textDecoder = new TextDecoder();
        let percent = 0;
        let isEndedGracefully = false;

        const updatePercent = (jsonData: Record<string, any>) => {
            if (Utils.Type.isNumber(jsonData.total) && Utils.Type.isNumber(jsonData.completed)) {
                percent = Math.floor((jsonData.completed / jsonData.total) * 10000) / 100;
                return true;
            }

            return false;
        };

        const endStream = async (error?: Error) => {
            isEndedGracefully = true;
            if (!error && bufferedChunks.length) {
                const allString = bufferedChunks.splice(0).join("");
                let jsonChunk: Record<string, any>;
                try {
                    jsonChunk = Utils.Json.Parse(allString);
                } catch (e) {
                    await setPullingModels({ model, toggle: false, skipIfExists: false });
                    return;
                }

                if (updatePercent(jsonChunk)) {
                    await Subscription.publish(ESocketTopic.OllamaManager, topicId, SocketEvents.SERVER.SETTINGS.OLLAMA.MODEL_PULLING_STATUS, {
                        percent,
                        model,
                    });
                } else {
                    await Subscription.publish(ESocketTopic.OllamaManager, topicId, SocketEvents.SERVER.SETTINGS.OLLAMA.MODEL_PULLING_STATUS, {
                        status: jsonChunk.status,
                        model,
                    });
                }
            }

            bufferedChunks.splice(0);

            if (error) {
                await Subscription.publish(ESocketTopic.OllamaManager, topicId, SocketEvents.SERVER.SETTINGS.OLLAMA.MODEL_PULLING_STATUS, {
                    status: "error",
                    error: error.message,
                    model,
                });
            } else {
                await Subscription.publish(ESocketTopic.OllamaManager, topicId, SocketEvents.SERVER.SETTINGS.OLLAMA.MODEL_PULLING_STATUS, {
                    status: "success",
                    model,
                });
            }

            await setPullingModels({ model, toggle: false, skipIfExists: false });

            result.data.removeAllListeners("data");
            result.data.removeAllListeners("end");
            result.data.removeAllListeners("error");
        };

        result.data
            .on("data", async (chunk) => {
                const chunkString = textDecoder.decode(chunk);
                if (!chunkString.trim()) {
                    return;
                }

                const splitChunks = chunkString.split("\n");
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

                    if (updatePercent(jsonChunk)) {
                        await Subscription.publish(ESocketTopic.OllamaManager, topicId, SocketEvents.SERVER.SETTINGS.OLLAMA.MODEL_PULLING_STATUS, {
                            percent,
                            model,
                        });
                    } else {
                        await Subscription.publish(ESocketTopic.OllamaManager, topicId, SocketEvents.SERVER.SETTINGS.OLLAMA.MODEL_PULLING_STATUS, {
                            status: jsonChunk.status,
                            model,
                        });
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
        Logger.error(error, "\n");
        await Subscription.publish(ESocketTopic.OllamaManager, topicId, SocketEvents.SERVER.SETTINGS.OLLAMA.MODEL_PULLING_STATUS, {
            status: "error",
            model,
            error: (error as Error).message,
        });
        await setPullingModels({ model, toggle: false, skipIfExists: false });
    }
});
