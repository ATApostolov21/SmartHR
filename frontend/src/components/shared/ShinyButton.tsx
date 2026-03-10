import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface ShinyButtonProps {
    children: ReactNode;
    onClick?: () => void;
    className?: string;
}

export const ShinyButton = ({ children, onClick, className = '' }: ShinyButtonProps) => {
    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className={`group relative overflow-hidden rounded-full bg-white/10 px-6 py-2 text-sm font-medium text-white backdrop-blur-md transition-all hover:bg-white/20 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] border border-white/20 ${className}`}
        >
            <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-12deg)_translateX(-150%)] group-hover:duration-1000 group-hover:[transform:skew(-12deg)_translateX(150%)]">
                <div className="relative h-full w-8 bg-white/30" />
            </div>
            <span className="relative flex items-center justify-center gap-2 z-10">
                {children}
            </span>
        </motion.button>
    );
};
