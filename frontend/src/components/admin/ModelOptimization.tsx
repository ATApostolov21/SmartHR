import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    RefreshCw, GitBranch, ChevronDown, CheckCircle2,
    Clock, TrendingUp, AlertCircle, Play, Settings2
} from 'lucide-react';

const versions = [
    { version: 'v3.2.1', date: '28 фев 2026', accuracy: 93.4, status: 'active' },
    { version: 'v3.1.0', date: '10 фев 2026', accuracy: 92.1, status: 'archived' },
    { version: 'v3.0.2', date: '18 ян 2026', accuracy: 91.5, status: 'archived' },
    { version: 'v2.9.0', date: '05 ян 2026', accuracy: 89.8, status: 'archived' },
    { version: 'v2.8.4', date: '20 дек 2025', accuracy: 88.3, status: 'archived' },
];

export const ModelOptimization = () => {
    const [dataset, setDataset] = useState('processed_v9');
    const [nEstimators, setNEstimators] = useState(200);
    const [maxDepth, setMaxDepth] = useState(15);
    const [testSplit, setTestSplit] = useState(20);
    const [isTraining, setIsTraining] = useState(false);
    const [trainStatus, setTrainStatus] = useState<null | 'success' | 'running'>(null);

    const handleRetrain = () => {
        setIsTraining(true);
        setTrainStatus('running');
        setTimeout(() => {
            setIsTraining(false);
            setTrainStatus('success');
        }, 3000);
    };

    return (
        <div className="h-full overflow-y-auto space-y-6 pr-1">
            {/* Header */}
            <div>
                <h1 className="text-xl font-bold text-white">Оптимизация на Модела</h1>
                <p className="text-sm text-white/40 mt-0.5">Конфигурирай и стартирай преобучение на AI модела</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
                {/* Retrain Configuration */}
                <div className="col-span-2 bg-white/[0.03] border border-white/8 rounded-xl p-5 space-y-5">
                    <div className="flex items-center gap-2">
                        <Settings2 size={15} className="text-blue-400" />
                        <h2 className="text-sm font-semibold text-white/80">Конфигурация на Обучение</h2>
                    </div>

                    {/* Dataset selector */}
                    <div className="space-y-1.5">
                        <label className="text-xs text-white/40 uppercase tracking-wider font-semibold">Dataset</label>
                        <div className="relative">
                            <select
                                value={dataset}
                                onChange={e => setDataset(e.target.value)}
                                className="w-full bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white/80 appearance-none focus:outline-none focus:border-blue-500/50 transition-colors"
                            >
                                <option value="processed_v9">processed_v9 (текущ)</option>
                                <option value="processed_v8">processed_v8</option>
                                <option value="raw_extended">raw_extended</option>
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                        </div>
                    </div>

                    {/* Hyperparameters */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs text-white/40 uppercase tracking-wider font-semibold">N Estimators</label>
                            <input
                                type="number"
                                value={nEstimators}
                                onChange={e => setNEstimators(+e.target.value)}
                                min={50} max={500} step={50}
                                className="w-full bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white/80 focus:outline-none focus:border-blue-500/50 transition-colors"
                            />
                            <p className="text-[10px] text-white/25">Брой дървета (50–500)</p>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs text-white/40 uppercase tracking-wider font-semibold">Max Depth</label>
                            <input
                                type="number"
                                value={maxDepth}
                                onChange={e => setMaxDepth(+e.target.value)}
                                min={3} max={30}
                                className="w-full bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white/80 focus:outline-none focus:border-blue-500/50 transition-colors"
                            />
                            <p className="text-[10px] text-white/25">Макс. дълбочина (3–30)</p>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs text-white/40 uppercase tracking-wider font-semibold">Test Split %</label>
                            <input
                                type="number"
                                value={testSplit}
                                onChange={e => setTestSplit(+e.target.value)}
                                min={10} max={40}
                                className="w-full bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white/80 focus:outline-none focus:border-blue-500/50 transition-colors"
                            />
                            <p className="text-[10px] text-white/25">Дял за тестване</p>
                        </div>
                    </div>

                    {/* Estimated config summary */}
                    <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg p-3 text-xs text-white/50 space-y-1">
                        <p className="text-blue-400 font-semibold text-[11px] uppercase tracking-wider mb-1.5">Обобщение</p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                            <span>Dataset: <span className="text-white/70">{dataset}</span></span>
                            <span>Дървета: <span className="text-white/70">{nEstimators}</span></span>
                            <span>Max Depth: <span className="text-white/70">{maxDepth}</span></span>
                            <span>Test Split: <span className="text-white/70">{testSplit}%</span></span>
                        </div>
                    </div>

                    {/* Start button */}
                    <button
                        onClick={handleRetrain}
                        disabled={isTraining}
                        className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all shadow-lg shadow-blue-500/20"
                    >
                        {isTraining ? (
                            <>
                                <RefreshCw size={15} className="animate-spin" />
                                Обучение в прогрес...
                            </>
                        ) : (
                            <>
                                <Play size={15} />
                                Стартирай Преобучение
                            </>
                        )}
                    </button>

                    {/* Status message */}
                    {trainStatus === 'success' && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-2 px-3 py-2.5 bg-green-500/10 border border-green-500/20 rounded-lg"
                        >
                            <CheckCircle2 size={14} className="text-green-400" />
                            <p className="text-xs text-green-300 font-medium">Моделът е преобучен успешно! Новата версия е v3.3.0 с accuracy 93.8%</p>
                        </motion.div>
                    )}
                </div>

                {/* Quick Stats */}
                <div className="space-y-3">
                    {[
                        { label: 'Текуща Accuracy', value: '93.4%', icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                        { label: 'Брой Версии', value: `${versions.length}`, icon: GitBranch, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                        { label: 'Прогн. Обучение', value: '~4 мин.', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                        { label: 'Последна Промяна', value: '+1.3%', icon: AlertCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                    ].map(({ label, value, icon: Icon, color, bg }) => (
                        <div key={label} className="bg-white/[0.03] border border-white/8 rounded-xl p-4 flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
                                <Icon size={15} className={color} />
                            </div>
                            <div>
                                <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold">{label}</p>
                                <p className="text-lg font-bold text-white leading-tight">{value}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Version History */}
            <div className="bg-white/[0.03] border border-white/8 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                    <GitBranch size={15} className="text-white/40" />
                    <h2 className="text-sm font-semibold text-white/80">История на Версиите</h2>
                </div>
                <div className="space-y-2">
                    {versions.map((v) => (
                        <motion.div
                            key={v.version}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center justify-between px-4 py-3 bg-white/[0.02] rounded-lg border border-white/5 hover:border-white/10 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <span className="font-mono text-sm font-semibold text-blue-400">{v.version}</span>
                                <span className="text-xs text-white/30">{v.date}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    <p className="text-sm font-semibold text-white/80">{v.accuracy}%</p>
                                    <p className="text-[10px] text-white/30">Accuracy</p>
                                </div>
                                {v.status === 'active' ? (
                                    <span className="px-2 py-0.5 bg-green-500/10 border border-green-500/20 rounded text-[10px] text-green-400 font-semibold">АКТИВЕН</span>
                                ) : (
                                    <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[10px] text-white/30 font-semibold">АРХИВ</span>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};
