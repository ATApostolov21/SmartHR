import { motion } from 'framer-motion';
import {
    BarChart3, Activity, Target, TrendingUp,
    CheckCircle2, AlertTriangle, Info, Cpu
} from 'lucide-react';

const MetricCard = ({ label, value, sub, color, icon: Icon }: {
    label: string; value: string; sub?: string; color: string; icon: any
}) => (
    <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/[0.03] border border-white/8 rounded-xl p-5 flex flex-col gap-3 hover:border-white/15 transition-colors"
    >
        <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white/40 uppercase tracking-widest">{label}</span>
            <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center`}>
                <Icon size={15} className="text-white/90" />
            </div>
        </div>
        <div>
            <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
            {sub && <p className="text-xs text-white/40 mt-1">{sub}</p>}
        </div>
    </motion.div>
);

const ProgressBar = ({ label, value, color }: { label: string; value: number; color: string }) => (
    <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
            <span className="text-white/60">{label}</span>
            <span className="text-white/80 font-semibold">{value}%</span>
        </div>
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${value}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={`h-full rounded-full ${color}`}
            />
        </div>
    </div>
);

// Mock confusion matrix data
const confusionMatrix = [
    [142, 8, 3],
    [5, 98, 12],
    [2, 9, 87],
];
const classLabels = ['Нисък', 'Среден', 'Висок'];

export const ModelAnalysis = () => {
    return (
        <div className="h-full overflow-y-auto space-y-6 pr-1">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-white">Анализ на Модела</h1>
                    <p className="text-sm text-white/40 mt-0.5">Текуща версия: <span className="text-blue-400 font-medium">v3.2.1</span> · Последно обучение: 28 фев 2026</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <CheckCircle2 size={13} className="text-green-400" />
                    <span className="text-xs text-green-400 font-semibold">Активен</span>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-4 gap-4">
                <MetricCard label="Accuracy" value="93.4%" sub="+1.2% от предходна версия" color="bg-blue-500/20" icon={Target} />
                <MetricCard label="Precision" value="91.8%" sub="Macro Average" color="bg-purple-500/20" icon={BarChart3} />
                <MetricCard label="Recall" value="90.5%" sub="Macro Average" color="bg-amber-500/20" icon={Activity} />
                <MetricCard label="F1 Score" value="91.1%" sub="Weighted Average" color="bg-emerald-500/20" icon={TrendingUp} />
            </div>

            {/* Per-class metrics + Confusion Matrix */}
            <div className="grid grid-cols-2 gap-4">
                {/* Per-class Metrics */}
                <div className="bg-white/[0.03] border border-white/8 rounded-xl p-5 space-y-5">
                    <div className="flex items-center gap-2">
                        <BarChart3 size={15} className="text-blue-400" />
                        <h2 className="text-sm font-semibold text-white/80">Метрики по Клас</h2>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-2.5">
                            <p className="text-[11px] text-white/30 uppercase tracking-widest font-semibold">Precision</p>
                            <ProgressBar label="Нисък риск" value={95} color="bg-emerald-500" />
                            <ProgressBar label="Среден риск" value={89} color="bg-amber-500" />
                            <ProgressBar label="Висок риск" value={91} color="bg-red-500" />
                        </div>
                        <div className="space-y-2.5 pt-3 border-t border-white/5">
                            <p className="text-[11px] text-white/30 uppercase tracking-widest font-semibold">Recall</p>
                            <ProgressBar label="Нисък риск" value={94} color="bg-emerald-500" />
                            <ProgressBar label="Среден риск" value={86} color="bg-amber-500" />
                            <ProgressBar label="Висок риск" value={88} color="bg-red-500" />
                        </div>
                    </div>
                </div>

                {/* Confusion Matrix */}
                <div className="bg-white/[0.03] border border-white/8 rounded-xl p-5 space-y-4">
                    <div className="flex items-center gap-2">
                        <Cpu size={15} className="text-purple-400" />
                        <h2 className="text-sm font-semibold text-white/80">Матрица на Грешките</h2>
                    </div>
                    <div className="space-y-1">
                        <div className="flex gap-1 mb-1 ml-12">
                            {classLabels.map(l => (
                                <div key={l} className="flex-1 text-center text-[10px] text-white/30 font-semibold">{l}</div>
                            ))}
                        </div>
                        {confusionMatrix.map((row, i) => (
                            <div key={i} className="flex items-center gap-1">
                                <span className="text-[10px] text-white/30 w-11 text-right font-semibold pr-1">{classLabels[i]}</span>
                                {row.map((val, j) => {
                                    const isCorrect = i === j;
                                    const maxVal = 142;
                                    const intensity = Math.round((val / maxVal) * 100);
                                    return (
                                        <motion.div
                                            key={j}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: (i * 3 + j) * 0.05 }}
                                            className={`flex-1 h-12 rounded flex items-center justify-center text-sm font-bold transition-colors
                                                ${isCorrect
                                                    ? 'bg-blue-500/30 text-blue-300 border border-blue-500/30'
                                                    : intensity > 20
                                                        ? 'bg-red-500/20 text-red-300 border border-red-500/20'
                                                        : 'bg-white/[0.04] text-white/50 border border-white/5'
                                                }`}
                                        >
                                            {val}
                                        </motion.div>
                                    );
                                })}
                            </div>
                        ))}
                        <p className="text-[10px] text-white/25 text-center pt-2">Редове = Истински | Колони = Предсказани</p>
                    </div>
                </div>
            </div>

            {/* Model Info */}
            <div className="bg-white/[0.03] border border-white/8 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                    <Info size={15} className="text-white/40" />
                    <h2 className="text-sm font-semibold text-white/80">Информация за Модела</h2>
                </div>
                <div className="grid grid-cols-4 gap-6 text-sm">
                    {[
                        { label: 'Алгоритъм', value: 'Random Forest' },
                        { label: 'Обучен на', value: 'processed_v9' },
                        { label: 'Тренировъчни записи', value: '12,840' },
                        { label: 'Тестови записи', value: '3,210' },
                        { label: 'Брой дървета', value: '200' },
                        { label: 'Max Depth', value: '15' },
                        { label: 'Features', value: '34' },
                        { label: 'Cross-val Score', value: '92.7%' },
                    ].map(({ label, value }) => (
                        <div key={label} className="space-y-1">
                            <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold">{label}</p>
                            <p className="text-white/80 font-medium">{value}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Overfitting check */}
            <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle size={15} className="text-amber-400 mt-0.5 shrink-0" />
                <div>
                    <p className="text-sm font-semibold text-amber-300">Проверка за Overfitting</p>
                    <p className="text-xs text-white/50 mt-0.5">
                        Train Accuracy: <span className="text-white/70 font-medium">96.1%</span> · Test Accuracy: <span className="text-white/70 font-medium">93.4%</span> · Разлика: <span className="text-amber-400 font-semibold">2.7%</span> — в допустими граници.
                    </p>
                </div>
            </div>
        </div>
    );
};
