import React, { useRef } from 'react';
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface ReflectiveCardProps {
    children: React.ReactNode;
    className?: string;
    glareColor?: string;
    intensity?: 'light' | 'heavy';
}

export const ReflectiveCard: React.FC<ReflectiveCardProps> = ({
    children,
    className = '',
    glareColor = 'rgba(245, 200, 66, 0.4)', // Amber/Gold glare default
    intensity = 'light'
}) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const mouseX = useMotionValue(0.5);
    const mouseY = useMotionValue(0.5);

    // Spring configuration for smooth returning and following
    const springConfig = { damping: 20, stiffness: 200, mass: 0.5 };
    const springX = useSpring(mouseX, springConfig);
    const springY = useSpring(mouseY, springConfig);

    // Compute rotations based on mouse position within card (0 to 1 range)
    // When mouse is at left (x=0), rotateY is negative (tilts left edge up)
    const rotateX = useTransform(springY, [0, 1], ["5deg", "-5deg"]);
    const rotateY = useTransform(springX, [0, 1], ["-5deg", "5deg"]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();

        // Compute normalized mouse coordinates [0, 1] relative to the card bounds
        const xRange = (e.clientX - rect.left) / rect.width;
        const yRange = (e.clientY - rect.top) / rect.height;

        mouseX.set(xRange);
        mouseY.set(yRange);
    };

    const handleMouseLeave = () => {
        // Reset to center smoothly
        mouseX.set(0.5);
        mouseY.set(0.5);
    };

    const bgMap = {
        light: "bg-black/40 backdrop-blur-xl border-white/10",
        heavy: "bg-[#111113]/80 backdrop-blur-2xl border-[#1a1a1f]"
    };

    return (
        <motion.div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                perspective: 1000,
                rotateX,
                rotateY,
                transformStyle: "preserve-3d"
            }}
            className={`relative rounded-2xl group transition-shadow duration-500 hover:shadow-[0_0_30px_rgba(212,168,83,0.15)] ${bgMap[intensity]} border ${className}`}
        >
            {/* The base noise and surface */}
            <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none z-0">
                <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=\"0 0 200 200\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cfilter id=\"noiseFilter\"%3E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\"0.65\" numOctaves=\"3\" stitchTiles=\"stitch\"/%3E%3C/filter%3E%3Crect width=\"100%25\" height=\"100%25\" filter=\"url(%23noiseFilter)\"/%3E%3C/svg%3E')" }} />
            </div>

            {/* Glowing Glare Effect */}
            <motion.div
                className="pointer-events-none absolute inset-0 z-20 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 mix-blend-screen"
                style={{
                    background: useMotionTemplate`
                        radial-gradient(
                            1200px circle at ${useTransform(springX, x => x * 100)}% ${useTransform(springY, y => y * 100)}%,
                            ${glareColor},
                            transparent 40%
                        )
                    `,
                }}
            />

            {/* Content Container */}
            <div className="relative z-10 w-full h-full transform-gpu" style={{ transform: 'translateZ(20px)' }}>
                {children}
            </div>
        </motion.div>
    );
};
