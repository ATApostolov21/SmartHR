import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Menu, X } from "lucide-react";
import { Logo } from "../shared/Logo";

interface LandingNavbarProps {
    onLoginClick: () => void;
}

const navLinks = [
    { label: "Функции", id: "features" },
    { label: "Анализи", id: "benefits" },
    { label: "Сигурност", id: "security" },
];

export const LandingNavbar = ({ onLoginClick }: LandingNavbarProps) => {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 24);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const scrollTo = (id: string) => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
        setMobileOpen(false);
    };

    return (
        <>
            <header
                className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
                style={{
                    background: scrolled
                        ? "rgba(9, 9, 15, 0.75)"
                        : "transparent",
                    backdropFilter: scrolled ? "blur(20px) saturate(180%)" : "none",
                    WebkitBackdropFilter: scrolled ? "blur(20px) saturate(180%)" : "none",
                    borderBottom: scrolled
                        ? "1px solid rgba(255,255,255,0.05)"
                        : "1px solid transparent",
                    boxShadow: scrolled
                        ? "0 1px 40px rgba(0,0,0,0.3)"
                        : "none",
                }}
            >
                <div className="max-w-7xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between gap-8">

                    {/* Logo */}
                    <button
                        onClick={() => scrollTo("hero")}
                        className="flex items-center gap-0 shrink-0 group"
                    >
                        <Logo size={28} />
                    </button>

                    {/* Desktop nav */}
                    <nav className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => (
                            <button
                                key={link.id}
                                onClick={() => scrollTo(link.id)}
                                className="px-4 py-2 rounded-lg text-white/55 hover:text-white text-sm font-medium transition-all duration-200 hover:bg-white/[0.05]"
                            >
                                {link.label}
                            </button>
                        ))}
                    </nav>

                    {/* CTA */}
                    <div className="hidden md:flex items-center gap-3 shrink-0">
                        <button
                            onClick={onLoginClick}
                            className="h-9 px-5 rounded-lg border border-white/10 text-white/70 hover:text-white hover:border-white/20 text-sm font-medium transition-all duration-200 hover:bg-white/[0.04]"
                        >
                            Вход
                        </button>
                        <button
                            onClick={onLoginClick}
                            className="h-9 px-5 rounded-lg bg-white text-[#0a0a0a] text-sm font-semibold hover:bg-white/90 transition-all duration-200 active:scale-95 flex items-center gap-1.5"
                        >
                            Започни сега
                            <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {/* Mobile toggle */}
                    <button
                        className="md:hidden p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/[0.05] transition-colors"
                        onClick={() => setMobileOpen((o) => !o)}
                        aria-label="Toggle menu"
                    >
                        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </header>

            {/* Mobile menu */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.18 }}
                        className="fixed top-16 left-0 right-0 z-40 border-b border-white/[0.06] px-6 py-4 flex flex-col gap-1"
                        style={{
                            background: "rgba(9, 9, 15, 0.92)",
                            backdropFilter: "blur(24px)",
                            WebkitBackdropFilter: "blur(24px)",
                        }}
                    >
                        {navLinks.map((link) => (
                            <button
                                key={link.id}
                                onClick={() => scrollTo(link.id)}
                                className="text-left px-3 py-2.5 rounded-xl text-white/65 hover:text-white hover:bg-white/[0.05] text-sm font-medium transition-colors"
                            >
                                {link.label}
                            </button>
                        ))}
                        <div className="h-px bg-white/[0.06] my-2" />
                        <button
                            onClick={() => { onLoginClick(); setMobileOpen(false); }}
                            className="flex items-center justify-center gap-1.5 h-10 rounded-xl bg-white text-[#0a0a0a] font-semibold text-sm"
                        >
                            Вход <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
