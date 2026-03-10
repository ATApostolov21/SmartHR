import React from 'react';
import { motion } from 'framer-motion';

interface ScrollStackItemProps {
    children: React.ReactNode;
    index: number;
    total: number;
}

export const ScrollStackItem: React.FC<ScrollStackItemProps> = ({ children, index }) => {
    // Determine overlapping behavior by sticking to top
    // with progressive offsets to show stacked cards
    const topOffset = `calc(15vh + ${index * 40}px)`;

    return (
        <motion.div
            className="sticky w-full max-w-4xl mx-auto rounded-3xl"
            style={{
                top: topOffset,
                zIndex: index,
            }}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ margin: "-10%" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
        >
            <div className="w-full h-full shadow-2xl rounded-3xl border border-brand-border bg-brand-surface/90 backdrop-blur-xl">
                {children}
            </div>
        </motion.div>
    );
};

export const ScrollStack: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = '' }) => {
    return (
        <div className={`relative w-full ${className}`}>
            <div className="flex flex-col gap-32 pb-[30vh]">
                {React.Children.map(children, (child, idx) => (
                    <ScrollStackItem index={idx} total={React.Children.count(children)}>
                        {child}
                    </ScrollStackItem>
                ))}
            </div>
        </div>
    );
};
