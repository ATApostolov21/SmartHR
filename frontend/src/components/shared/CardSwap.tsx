import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CardSwapProps {
    items: React.ReactNode[];
    autoPlay?: boolean;
    interval?: number;
    className?: string;
}

export const CardSwap: React.FC<CardSwapProps> = ({
    items,
    autoPlay = false,
    interval = 3000,
    className = ''
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (!autoPlay) return;
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % items.length);
        }, interval);
        return () => clearInterval(timer);
    }, [autoPlay, interval, items.length]);

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % items.length);
    };

    return (
        <div
            className={`relative flex items-center justify-center cursor-pointer perspective-[1200px] select-none ${className}`}
            onClick={handleNext}
        >
            <AnimatePresence mode="popLayout">
                {items.map((item, index) => {
                    // Calculate visual order: 0 is front, 1 is immediately behind, etc.
                    const isActive = index === currentIndex;
                    // Distance from active
                    let dist = index - currentIndex;
                    if (dist < 0) dist += items.length; // wrap around

                    // If it's the item just moved out, animate it departing
                    const isExiting = dist === items.length - 1;

                    // Compute dynamic stacking styles
                    const yOffset = dist * 20;
                    const scale = Math.max(0.6, 1 - dist * 0.05);
                    const opacity = Math.max(0, 1 - dist * 0.3);
                    const zIndex = items.length - dist;

                    if (isExiting) {
                        return (
                            <motion.div
                                key={index}
                                initial={false}
                                animate={{
                                    y: -80,
                                    scale: 1.05,
                                    opacity: 0,
                                    rotateZ: Math.random() * 10 - 5
                                }}
                                transition={{ duration: 0.4, ease: "easeInOut" }}
                                className="absolute top-0 left-0 w-full"
                                style={{ zIndex: 0 }}
                            >
                                {item}
                            </motion.div>
                        );
                    }

                    return (
                        <motion.div
                            key={index}
                            layout
                            initial={false}
                            animate={{
                                y: yOffset,
                                scale: scale,
                                opacity: opacity,
                                rotateZ: 0
                            }}
                            transition={{
                                type: "spring",
                                stiffness: 200,
                                damping: 20
                            }}
                            className={`absolute top-0 left-0 w-full transform-gpu ${isActive ? 'pointer-events-auto shadow-2xl shadow-brand-primary/10' : 'pointer-events-none'}`}
                            style={{ zIndex }}
                        >
                            {item}
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
};
