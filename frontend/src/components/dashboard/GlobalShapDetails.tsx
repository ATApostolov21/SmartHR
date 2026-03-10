import { motion } from "framer-motion"
import { X, ShieldAlert, Info, TrendingUp, TrendingDown } from "lucide-react"
import { Badge, Button } from "../ui-core"
import { cn } from "../../lib/utils"

interface GlobalShapDetailsProps {
    onClose: () => void;
    stats: any;
}

const FEATURE_DESCRIPTIONS: Record<string, string> = {
    "Overtime_Hours": "Количеството извънреден труд е критичен индикатор за прегаряне (burnout).",
    "Monthly_Salary": "Нивото на възнаграждение спрямо пазарните стандарти и вътрешната справедливост.",
    "Employee_Satisfaction_Score": "Директно измерване на субективното благосъстояние на служителя.",
    "Years_At_Company": "Продължителността на стажа може да индикира както лоялност, така и застой.",
    "Performance_Score": "Високото представяне често е свързано с по-високи очаквания и риск от 'headhunting'.",
    "Work_Hours_Per_Week": "Средно седмично натоварване. Прекомерните часове засилват стреса.",
    "Training_Hours": "Инвестицията в развитие обикновено намалява риска от напускане.",
}

export const GlobalShapDetails = ({ onClose, stats }: GlobalShapDetailsProps) => {
    return (
        <div className="flex flex-col h-full bg-[#0d0f18]/95 backdrop-blur-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
                <div>
                    <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-brand-accent1" />
                        Детайлен SHAP Анализ
                    </h2>
                    <p className="text-xs text-white/40 mt-1 uppercase tracking-widest font-bold">Глобални Рискови Фактори</p>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 transition-all active:scale-95"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                {/* Intro Card */}
                <div className="p-5 rounded-2xl bg-brand-accent1/5 border border-brand-accent1/10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Info size={48} />
                    </div>
                    <p className="text-sm text-white/70 leading-relaxed relative z-10">
                        SHAP (SHapley Additive exPlanations) стойностите измерват приноса на всяка променлива към крайната прогноза на модела.
                        Стойностите тук отразяват влиянието на тези фактори върху **цялата организация**.
                    </p>
                </div>

                {/* Factors List */}
                <div className="space-y-6">
                    <h3 className="text-xs font-bold text-white/30 uppercase tracking-[0.2em] px-1">Класация по влияние</h3>

                    <div className="space-y-4">
                        {(stats.top_risk_factors || []).map((factor: any, idx: number) => {
                            const maxImpact = stats.top_risk_factors?.[0]?.impact || 1
                            const percent = Math.min(100, (factor.impact / maxImpact) * 100)
                            const isPositive = factor.impact > 0

                            return (
                                <motion.div
                                    key={factor.name}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/10 transition-all group"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className={cn(
                                                "w-8 h-8 rounded-lg flex items-center justify-center border",
                                                isPositive ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                            )}>
                                                {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                            </div>
                                            <span className="text-sm font-bold text-white/90 group-hover:text-white transition-colors">
                                                {factor.name.replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                        <Badge variant="outline" className={cn(
                                            "font-mono font-bold",
                                            isPositive ? "bg-red-500/5 text-red-400 border-red-500/20" : "bg-emerald-500/5 text-emerald-400 border-emerald-500/20"
                                        )}>
                                            {isPositive ? '+' : ''}{factor.impact.toFixed(4)}
                                        </Badge>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${percent}%` }}
                                                transition={{ duration: 1, delay: 0.2 + idx * 0.05 }}
                                                className={cn(
                                                    "h-full rounded-full transition-all group-hover:brightness-110",
                                                    isPositive ? "bg-gradient-to-r from-red-600 to-orange-500" : "bg-gradient-to-r from-emerald-600 to-teal-500"
                                                )}
                                            />
                                        </div>

                                        {FEATURE_DESCRIPTIONS[factor.name] && (
                                            <p className="text-[11px] text-white/40 leading-relaxed italic">
                                                {FEATURE_DESCRIPTIONS[factor.name]}
                                            </p>
                                        )}
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/5 bg-white/[0.01]">
                <Button
                    onClick={onClose}
                    className="w-full bg-white/[0.05] border border-white/10 text-white hover:bg-white/10 h-12 font-bold transition-all rounded-xl"
                >
                    Разбрах
                </Button>
            </div>
        </div>
    )
}
