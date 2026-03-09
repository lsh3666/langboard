"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ReactElement } from "react";
import React from "react";

const Root = React.memo(({ className, children }: { className?: string; children: React.ReactNode }) => {
    const childrenArray = React.Children.toArray(children);

    return (
        <div className={`flex flex-col items-center gap-4 ${className}`}>
            <AnimatePresence>
                {childrenArray.map((item) => (
                    <Item key={(item as ReactElement).key}>{item}</Item>
                ))}
            </AnimatePresence>
        </div>
    );
});

Root.displayName = "AnimatedList";

function Item({ children }: { children: React.ReactNode }) {
    const animations = {
        initial: { scale: 0, opacity: 0 },
        animate: { scale: 1, opacity: 1, originY: 0 },
        exit: { scale: 0, opacity: 0 },
        transition: { type: "spring" as const, stiffness: 350, damping: 40 },
    };

    return (
        <motion.div {...animations} layout className="mx-auto w-full">
            {children}
        </motion.div>
    );
}

export default {
    Root,
    Item,
};
