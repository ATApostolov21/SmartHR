import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { LandingNavbar } from "./LandingNavbar";
import { LandingHero } from "./LandingHero";
import { LandingFeatures } from "./LandingFeatures";
import { LandingBenefits } from "./LandingBenefits";
import { Logo } from "../shared/Logo";

interface LandingPageProps {
    onLoginClick: () => void;
}

// Subtle radial glow that follows the mouse
const MagicCursor = () => {
    const [pos, setPos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handler = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
        window.addEventListener("mousemove", handler, { passive: true });
        return () => window.removeEventListener("mousemove", handler);
    }, []);

    return (
        <motion.div
            className="pointer-events-none fixed inset-0 z-[100]"
            animate={{
                background: `radial-gradient(600px circle at ${pos.x}px ${pos.y}px, rgba(79,126,247,0.07), transparent 40%)`,
            }}
            transition={{ type: "tween", ease: "linear", duration: 0 }}
        />
    );
};

export const LandingPage = ({ onLoginClick }: LandingPageProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({ container: containerRef });
    const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30 });


    return (
        <div
            ref={containerRef}
            className="relative min-h-screen bg-[#09090f] text-white overflow-y-auto overflow-x-hidden"
        >
            {/* ── Continuous full-page gradient background ── */}
            {/* Renders once here so there are zero seams between sections */}
            <div className="fixed inset-0 pointer-events-none z-0">
                {/* Top-centre blue bloom */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-5%,rgba(79,126,247,0.18)_0%,transparent_65%)]" />
                {/* Mid-left indigo */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_0%_45%,rgba(99,102,241,0.11)_0%,transparent_65%)]" />
                {/* Mid-right indigo */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_45%_35%_at_100%_55%,rgba(99,102,241,0.10)_0%,transparent_65%)]" />
                {/* Bottom purple fade */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_110%,rgba(129,140,248,0.10)_0%,transparent_65%)]" />
                {/* Dot grid */}
                <div
                    className="absolute inset-0 opacity-[0.045]"
                    style={{
                        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.65) 1px, transparent 1px)",
                        backgroundSize: "32px 32px",
                    }}
                />
            </div>
            {/* Scroll progress bar */}
            <motion.div
                className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-brand-accent1 via-brand-accent2 to-brand-accent3 origin-left z-[60]"
                style={{ scaleX }}
            />

            {/* Navigation */}
            <LandingNavbar onLoginClick={onLoginClick} />

            {/* Page sections */}
            <main>
                <LandingHero onLoginClick={onLoginClick} />
                <LandingFeatures />
                <LandingBenefits onLoginClick={onLoginClick} />
            </main>

            {/* Footer */}
            <footer className="border-t border-white/[0.05] py-8 px-6">
                <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Logo size={22} />
                        <span className="text-white/40 text-sm font-medium">Smart HR</span>
                    </div>
                    <p className="text-white/25 text-xs text-center">
                        © 2025–2026 Codingburgas · Проект за дипломна работа · Всички права запазени
                    </p>
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-emerald-400/70 text-xs font-medium">GDPR Compliant</span>
                    </div>
                </div>
            </footer>

            {/* Magic cursor glow */}
            <MagicCursor />
        </div>
    );
};
