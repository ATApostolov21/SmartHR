import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';

interface SplitTextProps {
    text: string;
    className?: string;
    delay?: number;
}

export const SplitText = ({ text, className = '', delay = 0 }: SplitTextProps) => {
    const letters = Array.from(text);

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: (i = 1) => ({
            opacity: 1,
            transition: { staggerChildren: 0.03, delayChildren: delay * i },
        }),
    };

    const childVariants: Variants = {
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: 'spring',
                damping: 12,
                stiffness: 100,
            },
        },
        hidden: {
            opacity: 0,
            y: 20,
            transition: {
                type: 'spring',
                damping: 12,
                stiffness: 100,
            },
        },
    };

    return (
        <motion.span
            className={`inline-flex flex-wrap ${className}`}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {letters.map((letter, index) => (
                <motion.span
                    variants={childVariants}
                    key={index}
                    className={letter === ' ' ? 'whitespace-pre' : ''}
                >
                    {letter}
                </motion.span>
            ))}
        </motion.span>
    );
};
