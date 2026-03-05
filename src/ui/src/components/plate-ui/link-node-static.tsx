import * as React from "react";
import { useLink } from "@platejs/link/react";
import type { TLinkElement } from "platejs";
import type { SlateElementProps } from "platejs/static";
import { SlateElement } from "platejs/static";
import LinkElementDialog from "@/components/plate-ui/link-node-dialog";

export function LinkElementStatic(props: SlateElementProps<TLinkElement>) {
    const { props: linkProps } = useLink({ element: props.element });
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const handleClick = React.useCallback(() => {
        if (!linkProps.href) {
            return;
        }

        setDialogOpen(true);
    }, [linkProps.href, setDialogOpen]);

    return (
        <>
            <SlateElement
                {...props}
                as="a"
                className="font-medium text-primary underline decoration-primary underline-offset-4"
                attributes={{
                    ...props.attributes,
                    onMouseOver: linkProps.onMouseOver,
                    href: undefined,
                    onClick: handleClick,
                }}
            >
                {props.children}
            </SlateElement>
            <LinkElementDialog isOpened={dialogOpen} setIsOpened={setDialogOpen} href={linkProps.href} />
        </>
    );
}
