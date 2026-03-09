import Box from "@/components/base/Box";
import Collapsible from "@/components/base/Collapsible";
import { cn } from "@/core/utils/ComponentUtils";
import { useState } from "react";

const MarkdownThinkBlock = ({ children = [] }: { children?: React.ReactNode }) => {
    const [isOpened, setIsOpened] = useState(false);

    return (
        <Collapsible.Root open={isOpened} onOpenChange={setIsOpened}>
            <Collapsible.Trigger asChild>
                <Box className={cn("max-w-full truncate italic text-foreground/70", isOpened ? "hidden" : "block")}>
                    <span className="font-bold">Think: Show more...</span>
                </Box>
            </Collapsible.Trigger>
            <Collapsible.Content>
                <Box className="italic text-foreground/70">
                    <span className="font-bold" onClick={() => setIsOpened(() => false)}>
                        Think:{" "}
                    </span>
                    {children}
                </Box>
            </Collapsible.Content>
        </Collapsible.Root>
    );
};

export default MarkdownThinkBlock;
