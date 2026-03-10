import { motion } from 'framer-motion';

export const Interactive3DDataVis = () => {
    return (
        <div className="relative w-full max-w-lg mx-auto aspect-square flex items-center justify-center perspective-[2000px]">
            <motion.div
                animate={{ rotateY: 360, rotateX: [0, 10, -10, 0] }}
                transition={{
                    rotateY: { duration: 20, repeat: Infinity, ease: 'linear' },
                    rotateX: { duration: 10, repeat: Infinity, ease: 'easeInOut' }
                }}
                className="w-full h-full transform-gpu relative flex items-center justify-center transform-style-3d"
                style={{ transformStyle: 'preserve-3d' }}
            >
                {/* Core Sphere */}
                <div className="absolute w-32 h-32 rounded-full bg-gradient-to-tr from-brand-accent1 via-brand-accent2 to-brand-accent3 blur-xl opacity-60 mix-blend-screen animate-pulse" />

                {/* Orbital Rings */}
                {[0, 1, 2].map((i) => (
                    <motion.div
                        key={i}
                        className="absolute rounded-full border border-brand-primary/30"
                        style={{
                            width: `${100 + i * 50}%`,
                            height: `${100 + i * 50}%`,
                            top: `${-i * 25}%`,
                            left: `${-i * 25}%`,
                            transform: `rotateX(${70 - i * 15}deg) rotateY(${i * 45}deg)`,
                        }}
                    >
                        {/* Data Nodes on Rings */}
                        <motion.div
                            className="absolute top-0 left-1/2 w-3 h-3 -mt-1.5 -ml-1.5 bg-brand-highlight rounded-full shadow-[0_0_15px_#fbbf24]"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 5 + i * 2, repeat: Infinity, ease: 'linear' }}
                            style={{ transformOrigin: `50% ${100 + i * 50}%` }}
                        />
                    </motion.div>
                ))}

                {/* Vertical Data Bars */}
                <div className="absolute inset-0 flex items-center justify-center gap-4" style={{ transform: 'translateZ(50px)' }}>
                    {[0.6, 0.8, 1, 0.7, 0.5].map((scale, i) => (
                        <motion.div
                            key={i}
                            className="w-4 bg-gradient-to-t from-brand-accent3/20 to-brand-accent1/80 rounded-t-lg backdrop-blur-md border border-brand-primary/50"
                            initial={{ height: 0 }}
                            animate={{ height: `${scale * 100}px` }}
                            transition={{ duration: 1, delay: i * 0.2 }}
                            style={{ transform: `translateZ(${Math.sin(i) * 50}px)` }}
                        />
                    ))}
                </div>
            </motion.div>
        </div>
    );
};
