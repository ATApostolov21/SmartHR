import React from 'react';
import { motion } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';

interface GlassSurfaceProps extends HTMLMotionProps<"div"> {
    children: React.ReactNode;
    className?: string;
    intensity?: 'light' | 'medium' | 'heavy';
    withNoise?: boolean;
    withGlare?: boolean;
}

export const GlassSurface = ({
    children,
    className = '',
    intensity = 'medium',
    withNoise = true,
    withGlare = true,
    ...props
}: GlassSurfaceProps) => {
    const intensityStyles = {
        light: 'bg-white/[0.02] border-white/[0.05] backdrop-blur-md',
        medium: 'bg-white/[0.05] border-white/[0.1] backdrop-blur-xl',
        heavy: 'bg-white/[0.08] border-white/[0.15] backdrop-blur-2xl text-shadow-sm',
    };

    return (
        <motion.div
            className={`
                relative overflow-hidden rounded-3xl
                border ${intensityStyles[intensity]}
                shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]
                ${className}
            `}
            {...props}
        >
            {/* Top inner highlight / Glare */}
            {withGlare && (
                <div className="absolute inset-0 z-0 pointer-events-none rounded-3xl overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/10 before:to-transparent before:opacity-50 before:h-[1px]" />
            )}

            {/* Optional SVG Noise Texture for ultra-premium feel */}
            {withNoise && (
                <div
                    className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                    }}
                />
            )}

            <div className="relative z-10 w-full h-full">
                {children}
            </div>
        </motion.div>
    );
};
