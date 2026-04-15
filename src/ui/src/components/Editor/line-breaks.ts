const LIST_ITEM_PATTERN = /^(\s*)([-*+]|\d+\.)\s+/;
const HEADING_PATTERN = /^#{1,6}\s+/;

const isBlankLine = (line: string) => line.trim() === "";
const isHeadingLine = (line: string) => HEADING_PATTERN.test(line);
const isListItemLine = (line: string) => LIST_ITEM_PATTERN.test(line);

// Plate markdown serialization can insert an empty paragraph between a heading and the
// following list. Collapse only that structural gap so user-authored blank lines elsewhere remain.
const normalizeHeadingListSpacing = (markdown: string) => {
    const lines = markdown.split("\n");
    const normalized: string[] = [];

    for (let index = 0; index < lines.length; ++index) {
        const line = lines[index];
        const previousLine = normalized[normalized.length - 1];
        const nextLine = lines[index + 1];

        if (isBlankLine(line) && previousLine && nextLine && isHeadingLine(previousLine) && isListItemLine(nextLine)) {
            continue;
        }

        normalized.push(line);
    }

    return normalized.join("\n");
};

export const cleanExtraLineBreaks = (markdown: string) => {
    if (!markdown) {
        return markdown;
    }

    return normalizeHeadingListSpacing(markdown);
};

export const preserveOriginalLineBreaks = (original: string, processed: string) => {
    if (!processed) {
        return processed;
    }

    const normalized = cleanExtraLineBreaks(processed);
    if (!original) {
        return normalized;
    }

    const originalEndsWithNewLine = original.endsWith("\n");
    if (originalEndsWithNewLine && !normalized.endsWith("\n")) {
        return `${normalized}\n`;
    }

    if (!originalEndsWithNewLine && normalized.endsWith("\n")) {
        return normalized.replace(/\n+$/g, "");
    }

    return normalized;
};
