import React from "react";
import { motion } from "framer-motion";
import { UploadCloud, BrainCircuit, Sliders, TrendingDown, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepProps {
    icon: React.ElementType;
    title: string;
    subtitle: string;
    delay: number;
    className?: string;
    iconColor?: string;
}

const Step = ({ icon: Icon, title, subtitle, delay, className, iconColor }: StepProps) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.8, x: -20 }}
        whileInView={{ opacity: 1, scale: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay }}
        className={cn("relative group flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-brand-accent1/30 transition-all duration-300 backdrop-blur-sm", className)}
    >
        <div className={cn("flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg", iconColor || "bg-brand-accent1/20 text-brand-accent1")}>
            <Icon className="w-6 h-6" />
        </div>
        <div>
            <h4 className="text-white font-bold text-sm mb-1">{title}</h4>
            <p className="text-white/50 text-xs leading-relaxed">{subtitle}</p>
        </div>
    </motion.div>
);

export function ProcessFlowAnimation() {
    return (
        <div className="relative w-full max-w-lg mx-auto py-12 px-4">
            {/* SVG Connecting Lines - Dynamic and Animated */}
            <svg
                className="absolute inset-0 w-full h-full pointer-events-none stroke-brand-accent1/20"
                viewBox="0 0 400 500"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <motion.path
                    initial={{ pathLength: 0 }}
                    whileInView={{ pathLength: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.5, delay: 0.5 }}
                    d="M100 80 V150"
                    strokeWidth="2"
                />
                <motion.path
                    initial={{ pathLength: 0 }}
                    whileInView={{ pathLength: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.5, delay: 1.0 }}
                    d="M100 190 V250"
                    strokeWidth="2"
                />
                {/* Branch */}
                <motion.path
                    initial={{ pathLength: 0 }}
                    whileInView={{ pathLength: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.5, delay: 1.5 }}
                    d="M100 250 H300 V300"
                    strokeWidth="2"
                />
                <motion.path
                    initial={{ pathLength: 0 }}
                    whileInView={{ pathLength: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.5, delay: 1.5 }}
                    d="M100 250 V300"
                    strokeWidth="2"
                />
                <motion.path
                    initial={{ pathLength: 0 }}
                    whileInView={{ pathLength: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.5, delay: 2.0 }}
                    d="M100 350 V400"
                    strokeWidth="2"
                />

                {/* Connection Orbs */}
                <motion.circle
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 2 }}
                    cx="100" cy="250" r="3" fill="currentColor"
                />
                <motion.circle
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 2.5 }}
                    cx="300" cy="250" r="3" fill="currentColor"
                />
            </svg>

            {/* Steps */}
            <div className="relative z-10 space-y-12">
                {/* Step 1 */}
                <div className="flex justify-start pl-8">
                    <Step
                        icon={UploadCloud}
                        title="Качване на данни"
                        subtitle="импорт на CSV от HR екипа"
                        delay={0.2}
                        className="w-64"
                    />
                </div>

                {/* Step 2 */}
                <div className="flex justify-start">
                    <Step
                        icon={BrainCircuit}
                        title="AI Моделиране"
                        subtitle="прогнозиране на риска в реално време"
                        delay={0.7}
                        className="w-72"
                    />
                </div>

                {/* Labels */}
                <div className="absolute top-[240px] left-[160px] z-20">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 1.8 }}
                        className="px-2 py-0.5 rounded bg-brand-accent1/20 border border-brand-accent1/30 text-[10px] text-brand-accent1 font-bold uppercase tracking-wider shadow-[0_0_30px_rgba(79,126,247,0.4)] backdrop-blur-md"
                    >
                        Анализирани
                    </motion.div>
                </div>

                {/* Branching Steps */}
                <div className="flex justify-between items-start pt-4">
                    <Step
                        icon={Sliders}
                        iconColor="bg-brand-accent2/20 text-brand-accent2"
                        title="SHAP Анализ"
                        subtitle="идентифициране на ключови драйвъри"
                        delay={1.7}
                        className="w-56"
                    />
                    <Step
                        icon={Activity}
                        iconColor="bg-brand-accent2/20 text-brand-accent2"
                        title="Индивидуален Риск"
                        subtitle="оценка за всеки служител"
                        delay={2.2}
                        className="w-56"
                    />
                </div>

                {/* Step 4 */}
                <div className="flex justify-start pl-8 mt-16">
                    <Step
                        icon={TrendingDown}
                        iconColor="bg-brand-highlight/20 text-brand-highlight"
                        title="Стратегически решения"
                        subtitle="намаляване на текучеството с прозрения"
                        delay={2.7}
                        className="w-72"
                    />
                </div>
            </div>
        </div>
    );
}
