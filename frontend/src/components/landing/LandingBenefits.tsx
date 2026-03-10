import { motion } from "framer-motion";
import { TrendingDown, DollarSign, ArrowRight } from "lucide-react";
import { GlowingEffect } from "../shared/GlowingEffect";

const stats = [
    {
        value: "50–200%",
        label: "от годишната заплата",
        description: "Толкова струва замяната на един служител.",
        icon: DollarSign,
    },
    {
        value: "0.94",
        label: "ROC AUC точност",
        description: "Моделът предсказва напускане с клинична прецизност.",
        icon: TrendingDown,
    },
];

export const LandingBenefits = ({ onLoginClick }: { onLoginClick?: () => void }) => {
    return (
        <section
            id="benefits"
            className="relative py-28 px-6 bg-transparent overflow-hidden"
        >

            <div className="max-w-5xl mx-auto relative z-10">
                {/* Section label */}
                <motion.p
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.5 }}
                    className="text-xs font-semibold tracking-[0.2em] uppercase text-brand-accent1 mb-4 text-center"
                >
                    Защо е важно
                </motion.p>

                {/* Headline */}
                <motion.h2
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.65, delay: 0.05 }}
                    className="text-4xl md:text-5xl font-black text-white tracking-tight text-center mb-6"
                >
                    Цената на игнорирането на{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent1 to-brand-accent2">
                        напускането е реална
                    </span>
                </motion.h2>

                {/* Body copy */}
                <motion.p
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="text-white/55 text-lg text-center max-w-2xl mx-auto mb-16 leading-relaxed"
                >
                    Замяната на един служител струва 50–200% от годишната му заплата.
                    Smart HR превръща реактивния проблем в проактивна стратегия.
                </motion.p>

                {/* Stat cards with GlowingEffect */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.65, delay: 0.15 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-16"
                >
                    {stats.map((stat, i) => {
                        const Icon = stat.icon;
                        return (
                            <div
                                key={i}
                                className="relative rounded-2xl border border-white/[0.07] bg-white/[0.03] p-8 overflow-hidden group hover:border-brand-accent1/20 hover:bg-white/[0.05] transition-all duration-300"
                            >
                                <GlowingEffect
                                    spread={40}
                                    glow={false}
                                    disabled={false}
                                    proximity={64}
                                    inactiveZone={0.01}
                                    borderWidth={1.5}
                                />
                                <div className="flex items-start gap-5 relative z-10">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-accent1 to-brand-accent3 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(79,126,247,0.35)]">
                                        <Icon className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-accent1 to-brand-accent2 mb-1">
                                            {stat.value}
                                        </div>
                                        <div className="text-white/80 font-semibold text-base mb-1">
                                            {stat.label}
                                        </div>
                                        <div className="text-white/45 text-sm leading-relaxed">
                                            {stat.description}
                                        </div>
                                    </div>
                                </div>
                                {/* Corner glow on hover */}
                                <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-brand-accent1/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                            </div>
                        );
                    })}
                </motion.div>

                {/* Divider */}
                <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-16" />

                {/* Security section */}
                <motion.div
                    id="security"
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.65, delay: 0.1 }}
                    className="relative rounded-2xl border border-white/[0.07] bg-white/[0.02] p-10 text-center overflow-hidden"
                >
                    <GlowingEffect
                        spread={60}
                        glow={false}
                        disabled={false}
                        proximity={80}
                        inactiveZone={0.05}
                        borderWidth={1.5}
                    />
                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-semibold tracking-wide uppercase mb-5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            GDPR Level-3 Compliant
                        </div>
                        <h3 className="text-2xl md:text-3xl font-black text-white mb-3">
                            Сигурност без компромис
                        </h3>
                        <p className="text-white/50 text-base max-w-xl mx-auto leading-relaxed">
                            Всички данни се обработват локално в твоята среда. Нищо не напуска
                            периметъра ти. Пълно съответствие с GDPR и корпоративни политики за
                            сигурност.
                        </p>
                    </div>
                </motion.div>

                {/* Final CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.65, delay: 0.15 }}
                    className="mt-20 text-center"
                >
                    <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
                        Готов да трансформираш HR стратегията си?
                    </h2>
                    <p className="text-white/50 mb-8 text-lg">
                        Присъедини се към организациите, използващи AI за задържане на таланти.
                    </p>
                    <button
                        onClick={onLoginClick}
                        className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-brand-accent1 to-brand-accent3 hover:brightness-110 text-white rounded-full font-bold text-base transition-all shadow-[0_0_30px_rgba(79,126,247,0.3)] hover:shadow-[0_0_50px_rgba(79,126,247,0.5)] active:scale-95"
                    >
                        Достъп до платформата
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                </motion.div>
            </div>
        </section>
    );
};
