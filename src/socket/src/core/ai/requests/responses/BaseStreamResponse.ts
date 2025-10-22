/* eslint-disable @typescript-eslint/no-explicit-any */
export interface IStreamRespuestParams {
    url: string;
    headers?: Record<string, any>;
    body: Record<string, any>;
    signal?: AbortSignal;
    onEnd?: () => void;
}

export interface IStreamResponseCallbackMap {
    onMessage?: (message: string) => void | Promise<void>;
    onEnd?: () => void | Promise<void>;
    onError?: (error: Error) => void | Promise<void>;
}

abstract class BaseStreamResponse {
    protected registeredCallbacks: IStreamResponseCallbackMap;

    constructor(protected params: IStreamRespuestParams) {
        this.registeredCallbacks = {};
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

    public abstract stream(): Promise<void>;
}

export default BaseStreamResponse;
