import { useState } from "react";
import Box from "@/components/base/Box";
import Button from "@/components/base/Button";
import Floating from "@/components/base/Floating";
import IconComponent from "@/components/base/IconComponent";
import useResizeEvent from "@/core/hooks/useResizeEvent";
import { cn } from "@/core/utils/ComponentUtils";
import { ScreenMap } from "@/core/utils/VariantUtils";
import { Utils } from "@langboard/core/utils";

export interface IResizableSidebarProps {
    main: React.ReactNode;
    children: React.ReactNode;
    initialWidth: number;
    defaultCollapsed?: bool;
    collapsableWidth?: number;
    floatingIcon?: string;
    floatingTitle?: string;
    floatingFullScreen?: bool;
    hidden?: bool;
}

function ResizableSidebar({
    main,
    children,
    initialWidth,
    collapsableWidth = 100,
    defaultCollapsed = false,
    floatingIcon = "plus",
    floatingTitle = "common.Actions",
    floatingFullScreen = false,
    hidden,
}: IResizableSidebarProps) {
    const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
    const [isMobile, setIsMobile] = useState(window.innerWidth < ScreenMap.size.md);

    const collapsedWidth = 26;

    if (collapsableWidth < 100) {
        throw new Error("collapsableWidth must be greater than 100");
    }

    useResizeEvent(
        {
            doneCallback: () => {
                setIsMobile(window.innerWidth < ScreenMap.size.md);
            },
        },
        [setIsMobile]
    );

    const sidebarId = `resizable-sidebar-${Utils.String.Token.shortUUID()}`;
    const setCollapsedAttr = (collapsed: bool, sidebar?: HTMLElement, widthSize?: number) => {
        sidebar = sidebar ?? document.getElementById(sidebarId)!;
        if (!widthSize) {
            if (collapsed) {
                widthSize = collapsedWidth;
            } else {
                widthSize = collapsableWidth;
            }
        }

        sidebar.style.maxWidth = `${widthSize}px`;

        sidebar.setAttribute("data-collapsed", collapsed ? "true" : "false");
    };

    const startResizing = (originalEvent: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        document.documentElement.style.cursor = "e-resize";
        document.documentElement.style.userSelect = "none";

        const target = originalEvent.currentTarget;
        const sidebar = target.parentElement!;
        const originalWidth = parseFloat(getComputedStyle(sidebar, null).getPropertyValue("width").replace("px", ""));
        const originalMouseX = originalEvent.pageX;

        target.setAttribute("data-selected", "true");
        sidebar.setAttribute("data-resizing", "true");

        const handleResizing = (event: MouseEvent) => {
            const width = originalWidth + (event.pageX - originalMouseX);
            if (width > collapsableWidth) {
                setCollapsedAttr(false, sidebar, width);
            } else if (width <= collapsableWidth && width >= (collapsableWidth + collapsedWidth) / 2) {
                setCollapsedAttr(false, sidebar);
            } else {
                setCollapsedAttr(true, sidebar);
            }
        };

        const stopResizing = () => {
            document.documentElement.style.cursor = "";
            document.documentElement.style.userSelect = "";
            sidebar.removeAttribute("data-resizing");
            target.removeAttribute("data-selected");
            window.removeEventListener("mousemove", handleResizing);
            window.removeEventListener("mouseup", stopResizing);
            setIsCollapsed(sidebar.getAttribute("data-collapsed") === "true");
        };

        window.addEventListener("mousemove", handleResizing);
        window.addEventListener("mouseup", stopResizing);
    };

    return (
        <>
            <Box
                display={{ initial: "block", md: "flex" }}
                w="full"
                className="h-[calc(100vh_-_theme(spacing.16))] transition-all duration-200 ease-in-out"
            >
                <Box
                    position="relative"
                    display={{ initial: "hidden", md: hidden ? "hidden" : "block" }}
                    size="full"
                    className="group/sidebar border-r transition-all data-[resizing=true]:transition-none"
                    style={{ maxWidth: `${initialWidth}px` }}
                    data-collapsed={isCollapsed ? "true" : "false"}
                    id={sidebarId}
                    hidden={hidden}
                >
                    <aside
                        className={cn(
                            "sticky z-50 flex size-full flex-col items-start text-sm font-medium group-data-[collapsed=true]/sidebar:hidden"
                        )}
                    >
                        {!isMobile && children}
                    </aside>

                    <Box
                        position="absolute"
                        top="0"
                        z="50"
                        h="full"
                        cursor="e-resize"
                        className={cn(
                            "resizer -right-px w-[3px] bg-transparent opacity-85 transition-colors",
                            "duration-200 ease-in-out hover:bg-primary data-[selected=true]:bg-primary"
                        )}
                        onMouseDown={startResizing}
                    />

                    <Button
                        variant="secondary"
                        onClick={() => {
                            setCollapsedAttr(!isCollapsed, undefined, isCollapsed ? initialWidth : undefined);
                            setIsCollapsed(!isCollapsed);
                        }}
                        className={cn(
                            "absolute right-[-1.2rem] top-1/2 z-50 size-10 -translate-y-1/2 transform rounded-full p-0",
                            "group-data-[resizing=true]/sidebar:hidden"
                        )}
                    >
                        <IconComponent icon={isCollapsed ? "chevron-right" : "chevron-left"} size="8" />
                    </Button>
                </Box>
                {main}
            </Box>
            <Floating.Button.Root fullScreen={floatingFullScreen} hidden={hidden}>
                <Floating.Button.Content key={Utils.String.Token.uuid()}>
                    {floatingFullScreen && <Floating.Button.CloseButton />}
                    {isMobile && children}
                </Floating.Button.Content>
                <Floating.Button.Trigger key={Utils.String.Token.uuid()} icon={floatingIcon} title={floatingTitle} titleSide="right" />
            </Floating.Button.Root>
        </>
    );
}

export default ResizableSidebar;
