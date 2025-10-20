export const toCssWidth = (value: unknown): string | undefined => {
    if (typeof value === "number") {
        return Number.isFinite(value) ? `${value}px` : undefined;
    }

    if (typeof value === "string") {
        const trimmed = value.trim();
        if (trimmed.length === 0) return undefined;
        if (/^\d+(\.\d+)?$/.test(trimmed)) {
            return `${trimmed}px`;
        }
        return trimmed;
    }

    return undefined;
};
