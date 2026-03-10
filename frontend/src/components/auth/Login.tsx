import React, { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, AlertCircle, Loader2, Eye, EyeOff } from "lucide-react";
import { Logo } from "../shared/Logo";
import { useAuth } from "../../lib/auth";
import { api } from "../../services/api";

interface LoginProps {
    onBack?: () => void;
}

export const Login = ({ onBack }: LoginProps) => {
    const { login } = useAuth();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);
        try {
            const response = await api.login(username, password);
            login(response.access_token, response.role);
        } catch (err: any) {
            setError(
                err.response?.data?.detail ||
                "Неуспешен вход. Моля, проверете данните си."
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#09090f] flex relative overflow-hidden">

            {/* ── Shared gradient background ── */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-5%,rgba(79,126,247,0.18)_0%,transparent_65%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_0%_45%,rgba(99,102,241,0.11)_0%,transparent_65%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_45%_35%_at_100%_55%,rgba(99,102,241,0.10)_0%,transparent_65%)]" />
                <div
                    className="absolute inset-0 opacity-[0.04]"
                    style={{
                        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.65) 1px, transparent 1px)",
                        backgroundSize: "32px 32px",
                    }}
                />
            </div>

            {/* ── Left branding panel (desktop) ── */}
            <div className="hidden lg:flex lg:w-1/2 relative z-10 flex-col justify-between p-14 border-r border-white/[0.05]">
                {/* Logo + back */}
                <div className="flex items-center gap-3">
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center hover:bg-white/[0.08] transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4 text-white/60" />
                        </button>
                    )}
                    <Logo size={32} />
                </div>

                {/* Headline */}
                <div className="space-y-5 max-w-md">
                    <motion.h1
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.65, ease: "easeOut" }}
                        className="text-5xl font-black text-white leading-[1.06] tracking-tight"
                    >
                        Предвиди напускането{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent1 to-brand-accent3">
                            Задръж таланта
                        </span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.65, delay: 0.1, ease: "easeOut" }}
                        className="text-white/40 text-base leading-relaxed"
                    >
                        AI‑базирана платформа за HR анализи — предсказва риска от напускане, обяснява причините и ти дава инструментите да действаш проактивно.
                    </motion.p>

                    {/* Stats */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.65, delay: 0.18, ease: "easeOut" }}
                        className="flex items-center pt-2"
                    >
                        {[
                            { v: "94%", l: "ROC AUC" },
                            { v: "88%", l: "Прецизност" },
                            { v: "86%", l: "Обхват" },
                        ].map((s, i) => (
                            <React.Fragment key={s.l}>
                                {i > 0 && <div className="w-px h-8 bg-white/[0.08] mx-6" />}
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-accent1 to-brand-accent2">
                                        {s.v}
                                    </span>
                                    <span className="text-[10px] text-white/35 uppercase tracking-widest font-medium">
                                        {s.l}
                                    </span>
                                </div>
                            </React.Fragment>
                        ))}
                    </motion.div>
                </div>

                {/* Bottom badge */}
                <div className="flex items-center gap-2.5">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/[0.06]">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-emerald-400/80 text-xs font-medium">GDPR Compliant</span>
                    </div>
                    <span className="text-white/20 text-xs">· v2.0.0-RBAC</span>
                </div>
            </div>

            {/* ── Right form panel ── */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 z-10">
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55, ease: "easeOut" }}
                    className="w-full max-w-md"
                >
                    {/* Mobile header */}
                    <div className="flex lg:hidden items-center justify-center gap-3 mb-10 relative">
                        {onBack && (
                            <button
                                onClick={onBack}
                                className="absolute left-0 w-9 h-9 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center hover:bg-white/[0.08] transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4 text-white/60" />
                            </button>
                        )}
                        <Logo size={32} />
                    </div>

                    {/* Card */}
                    <div
                        className="relative rounded-2xl border border-white/[0.08] p-8"
                        style={{
                            background: "rgba(13,15,24,0.7)",
                            backdropFilter: "blur(24px)",
                            WebkitBackdropFilter: "blur(24px)",
                            boxShadow: "0 0 0 1px rgba(255,255,255,0.03) inset, 0 24px 64px rgba(0,0,0,0.4)",
                        }}
                    >
                        {/* Top accent line */}
                        <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-brand-accent1/40 to-transparent" />

                        {/* Header */}
                        <div className="mb-7">
                            <h2 className="text-2xl font-black text-white mb-1.5 tracking-tight">
                                Вход в системата
                            </h2>
                            <p className="text-white/40 text-sm">
                                Въведи своите данни за достъп до платформата.
                            </p>
                        </div>

                        {/* Error */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 flex gap-2.5 text-red-400 items-start"
                            >
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                <span className="text-sm">{error}</span>
                            </motion.div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Username */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-white/50 uppercase tracking-widest">
                                    Потребителско име
                                </label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full h-11 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 text-white text-sm focus:outline-none focus:border-brand-accent1/40 focus:ring-1 focus:ring-brand-accent1/20 transition-all placeholder:text-white/20"
                                    placeholder="admin"
                                    autoComplete="username"
                                    required
                                />
                            </div>

                            {/* Password */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-white/50 uppercase tracking-widest">
                                    Парола
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full h-11 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 pr-12 text-white text-sm focus:outline-none focus:border-brand-accent1/40 focus:ring-1 focus:ring-brand-accent1/20 transition-all placeholder:text-white/20"
                                        placeholder="••••••••"
                                        autoComplete="current-password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((v) => !v)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Submit */}
                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full flex items-center justify-center gap-2 h-11 bg-gradient-to-r from-brand-accent1 to-brand-accent3 hover:brightness-110 text-white rounded-xl font-semibold text-sm transition-all shadow-[0_0_20px_rgba(79,126,247,0.2)] hover:shadow-[0_0_32px_rgba(79,126,247,0.4)] disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] group"
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            Влез в системата
                                            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>

                        <div className="mt-6 pt-5 border-t border-white/[0.06] text-center">
                            <p className="text-xs text-white/20 leading-relaxed">
                                Влизайки, потвърждаваш обработката на данни съгласно GDPR Level‑3.
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};
