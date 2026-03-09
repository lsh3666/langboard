/* eslint-disable @typescript-eslint/no-explicit-any */
import { default as BaseMarkdown, Components, Options as MarkdownOptions } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeMathjax from "rehype-mathjax";
import MarkdownCodeBlock from "@/components/Markdown/CodeBlock";
import { IChatContent } from "@/core/models/Base";
import Box from "@/components/base/Box";
import MarkdownDateBlock from "@/components/Markdown/DateBlock";
import rehypeRaw from "rehype-raw";
import { cn } from "@/core/utils/ComponentUtils";
import MarkdownThinkBlock from "@/components/Markdown/ThinkBlock";
import { memo } from "react";

export interface IMarkdownProps extends Omit<MarkdownOptions, "remarkPlugins" | "rehypePlugins" | "className" | "components" | "children"> {
    message: IChatContent | { content: string };
}

const Markdown = memo(({ message, ...mdProps }: IMarkdownProps): React.JSX.Element => {
    const components: Components = {
        p({ node, ...props }) {
            return <div>{props.children}</div>;
        },
        pre({ node, ...props }) {
            return <>{props.children}</>;
        },
        ol({ node, ...props }) {
            return <ol className="max-w-full">{props.children}</ol>;
        },
        ul({ node, ...props }) {
            return <ul className="max-w-full">{props.children}</ul>;
        },
        a({ node, ...props }) {
            return <a className="underline underline-offset-4" target="_blank" {...props} />;
        },
        table({ node, ...props }) {
            return (
                <div className="prose prose-invert">
                    <table>{props.children}</table>
                </div>
            );
        },
        code({ node, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            return match ? (
                <MarkdownCodeBlock language={match[1]} code={String(children).replace(/\n$/, "")} />
            ) : (
                <code className={cn("whitespace-pre-wrap rounded-md bg-neutral-800 px-[0.3em] py-[0.2em] font-mono text-sm", className)} {...props}>
                    {children}
                </code>
            );
        },
    };

    (components as any).date = MarkdownDateBlock;
    (components as any).think = MarkdownThinkBlock;

    const replaceNewlinesInTags = (content: string): string => {
        return content.replace(/(<[^>]+>)([\s\S]*?)(<\/[^>]+>)/g, (_, openTag, innerContent, closeTag) => {
            const trimmedContent = innerContent.replace(/^\n+|\n+$/g, "");
            const updatedContent = trimmedContent.replace(/\n/g, "<br>");
            return `${openTag}${updatedContent}${closeTag}`;
        });
    };

    const sanitizedContent = replaceNewlinesInTags(message.content);

    return (
        <Box className="markdown max-w-full">
            <BaseMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw, rehypeMathjax]} components={components} {...mdProps}>
                {sanitizedContent}
            </BaseMarkdown>
        </Box>
    );
});

export default Markdown;
