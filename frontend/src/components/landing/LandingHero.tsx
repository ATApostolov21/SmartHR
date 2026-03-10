"use client";
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ArrowRight, Brain, ChevronRight, Sliders, TrendingUp } from "lucide-react";
import React from "react";

// ── DisplayCard ────────────────────────────────────────────────────────────────
interface DisplayCardProps {
    className?: string;
    style?: React.CSSProperties;
    icon?: React.ReactNode;
    title?: string;
    description?: string;
    tag?: string;
    iconClassName?: string;
    titleClassName?: string;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
}

function DisplayCard({
    className, style, icon, title = "Featured",
    description = "Discover amazing content", tag = "Now",
    iconClassName = "bg-blue-900/60", titleClassName = "text-blue-300",
    onMouseEnter, onMouseLeave,
}: DisplayCardProps) {
    return (
        <div
            className={cn(
                "relative flex h-40 w-[22rem] -skew-y-[8deg] select-none flex-col justify-between",
                "rounded-xl border border-white/[0.09] bg-[#0d0f18]/90 backdrop-blur-sm",
                "px-4 py-3 transition-all duration-500",
                "after:absolute after:-right-1 after:top-[-5%] after:h-[110%] after:w-[18rem]",
                "after:bg-gradient-to-l after:from-[#09090f] after:to-transparent after:content-['']",
                "hover:border-white/20 cursor-pointer",
                className
            )}
            style={style}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <div className="flex items-center gap-2">
                <span className={cn("relative inline-block rounded-full p-1.5", iconClassName)}>
                    {icon}
                </span>
                <p className={cn("text-base font-semibold", titleClassName)}>{title}</p>
            </div>
            <p className="text-sm text-white/70 leading-snug font-medium">{description}</p>
            <p className="text-xs text-white/35 font-medium uppercase tracking-wide">{tag}</p>
        </div>
    );
}

// ── Card Stack (3 cards, hover-aware) ─────────────────────────────────────────
const CARD_DATA = [
    {
        icon: <Sliders className="size-4 text-amber-300" />,
        title: 'Симулатор „Ами ако"',
        description: "Тествай сценарии преди да вземеш решение.",
        tag: "Симулации",
        iconClassName: "bg-amber-900/60",
        titleClassName: "text-amber-300",
    },
    {
        icon: <Brain className="size-4 text-emerald-300" />,
        title: "AI Обяснимост",
        description: "Разбирай всяко решение — не черна кутия.",
        tag: "XAI модел",
        iconClassName: "bg-emerald-900/60",
        titleClassName: "text-emerald-300",
    },
    {
        icon: <TrendingUp className="size-4 text-brand-accent1" />,
        title: "Измерим резултат",
        description: "Задръж ключови хора преди да са решили да тръгнат.",
        tag: "ROI метрики",
        iconClassName: "bg-blue-900/60",
        titleClassName: "text-brand-accent1",
    },
];

function CardStack() {
    const [hovered, setHovered] = useState<number | null>(null);
    const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleEnter = (idx: number) => {
        if (leaveTimer.current) clearTimeout(leaveTimer.current);
        setHovered(idx);
    };

    const handleLeave = () => {
        leaveTimer.current = setTimeout(() => setHovered(null), 120);
    };

    const getOpacity = (idx: number) => {
        if (hovered === null) return [0.45, 0.72, 1][idx];
        if (hovered === idx) return 1;
        return 0.25;
    };

    const getZ = (idx: number) => {
        if (hovered === idx) return 50;
        return [10, 20, 30][idx];
    };

    // Resting x/y offsets — cards NEVER move on hover, only opacity+z+border change
    const TX = ["translate-x-[3rem]", "translate-x-[1.5rem]", "translate-x-0"];
    const TY = ["translate-y-[2.5rem]", "translate-y-[1.25rem]", "translate-y-0"];
    const ACCENT_RGB = ["252,211,77", "110,231,183", "79,126,247"];

    return (
        <div className="grid [grid-template-areas:'stack'] place-items-center">
            {CARD_DATA.map((card, idx) => (
                <DisplayCard
                    key={idx}
                    {...card}
                    className={cn(
                        "[grid-area:stack]",
                        TX[idx], TY[idx],
                        idx === 2 && "border-brand-accent1/20",
                    )}
                    style={{
                        opacity: getOpacity(idx),
                        zIndex: getZ(idx),
                        transition: "opacity 0.35s ease, box-shadow 0.35s ease, border-color 0.35s ease",
                        boxShadow: hovered === idx
                            ? `0 0 40px -10px rgba(${ACCENT_RGB[idx]},0.55), 0 16px 40px rgba(0,0,0,0.5)`
                            : idx === 2
                                ? "0 0 40px -12px rgba(79,126,247,0.4)"
                                : undefined,
                        borderColor: hovered === idx
                            ? `rgba(${ACCENT_RGB[idx]},0.35)`
                            : undefined,
                    }}
                    onMouseEnter={() => handleEnter(idx)}
                    onMouseLeave={handleLeave}
                />
            ))}
        </div>
    );
}

// ── Fade-up ────────────────────────────────────────────────────────────────────
const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: (d = 0) => ({
        opacity: 1, y: 0,
        transition: { duration: 0.6, ease: "easeOut" as const, delay: d },
    }),
};
const statsData = [
    { val: "94%", label: "ROC AUC" },
    { val: "88%", label: "Прецизност" },
    { val: "86%", label: "Обхват" },
];

// ── Hero ───────────────────────────────────────────────────────────────────────
export const LandingHero = ({ onLoginClick }: { onLoginClick?: () => void }) => (
    <section
        id="hero"
        className="relative min-h-screen py-24 md:py-0 bg-transparent overflow-hidden flex items-center"
    >
        <div className="absolute bottom-0 left-0 right-0 h-36 bg-gradient-to-t from-[#09090f] to-transparent pointer-events-none z-10" />
        <div className="absolute w-full h-px bottom-0 left-0 z-10"
            style={{ background: "radial-gradient(50% 50% at 50% 50%, rgba(79,126,247,0.3) 0%, transparent 100%)" }}
        />

        <div className="container max-w-[1220px] w-full px-6 md:px-10 relative z-20 mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-8 items-center min-h-screen py-28 md:py-0">

                {/* LEFT */}
                <div className="flex flex-col items-start gap-7 max-w-[500px]">
                    <motion.div variants={fadeUp} custom={0} initial="hidden" animate="visible"
                        className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/[0.06]"
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.9)]" />
                        <span className="text-xs font-medium text-emerald-400/90 tracking-wide">
                            Следващо поколение HR платформа
                        </span>
                    </motion.div>

                    <motion.h1 variants={fadeUp} custom={0.07} initial="hidden" animate="visible"
                        className="text-[3.5rem] md:text-[4rem] font-black text-white tracking-tight leading-[1.04]"
                    >
                        Предвиди<br />
                        напускането{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent1 via-brand-accent2 to-brand-accent3">
                            Задръж таланта
                        </span>
                    </motion.h1>

                    <motion.p variants={fadeUp} custom={0.13} initial="hidden" animate="visible"
                        className="text-white/45 text-base leading-[1.75] max-w-[420px]"
                    >
                        AI‑базирана видимост кой служител е в риск да напусне — и точно защо — за да действаш преди да е станало&nbsp;късно.
                    </motion.p>

                    <motion.div variants={fadeUp} custom={0.19} initial="hidden" animate="visible"
                        className="flex items-center gap-3"
                    >
                        <button
                            onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
                            className="group inline-flex items-center gap-1.5 h-11 px-6 rounded-xl bg-gradient-to-r from-brand-accent1 to-brand-accent3 text-white font-semibold text-sm hover:brightness-110 hover:shadow-[0_0_32px_rgba(79,126,247,0.4)] active:scale-95 transition-all duration-200"
                        >
                            Разгледай функциите
                            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                        <button
                            onClick={onLoginClick}
                            className="inline-flex items-center gap-1.5 h-11 px-6 rounded-xl border border-white/10 text-white/60 hover:text-white hover:border-white/20 font-medium text-sm transition-all duration-200 hover:bg-white/[0.04]"
                        >
                            Виж анализите
                            <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    </motion.div>

                    <motion.div variants={fadeUp} custom={0.25} initial="hidden" animate="visible"
                        className="flex items-center pt-1"
                    >
                        {statsData.map((s, i) => (
                            <React.Fragment key={s.label}>
                                {i > 0 && <div className="w-px h-8 bg-white/[0.08] mx-6" />}
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-accent1 to-brand-accent2 tabular-nums">
                                        {s.val}
                                    </span>
                                    <span className="text-[10px] text-white/35 uppercase tracking-widest font-medium">
                                        {s.label}
                                    </span>
                                </div>
                            </React.Fragment>
                        ))}
                    </motion.div>
                </div>

                {/* RIGHT — 3-card stack */}
                <motion.div
                    variants={fadeUp} custom={0.15}
                    initial="hidden" animate="visible"
                    className="hidden md:flex items-center justify-center"
                    style={{ paddingBottom: "5rem" }}
                >
                    <CardStack />
                </motion.div>

            </div>
        </div>
    </section>
);
