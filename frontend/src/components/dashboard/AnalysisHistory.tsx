import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Clock, Users, AlertTriangle, TrendingDown,
    CheckCircle2, RefreshCw, ChevronDown, BarChart2,
    Play, X, Trash2
} from "lucide-react"
import { api } from "../../services/api"
import { useAppState } from "../../lib/store"
import { cn } from "../../lib/utils"

interface AnalysisSummary {
    id: number
    name: string
    created_at: string
    is_active: boolean
    created_by: string
    total_employees: number
    high_risk_count: number
    avg_risk: number
}

const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleString("bg-BG", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit"
    })
}

export const AnalysisHistory = () => {
    const { setDashboardStats } = useAppState()
    const [analyses, setAnalyses] = React.useState<AnalysisSummary[]>([])
    const [loading, setLoading] = React.useState(true)
    const [activating, setActivating] = React.useState<number | null>(null)
    const [deleting, setDeleting] = React.useState<number | null>(null)
    const [expandedId, setExpandedId] = React.useState<number | null>(null)
    const [detailStats, setDetailStats] = React.useState<Record<number, any>>({})

    const loadAnalyses = React.useCallback(async () => {
        setLoading(true)
        try {
            const data = await api.getAnalyses()
            setAnalyses(data)
        } catch (err) {
            console.error("Failed to load analyses", err)
        } finally {
            setLoading(false)
        }
    }, [])

    React.useEffect(() => { loadAnalyses() }, [loadAnalyses])

    const handleActivate = async (id: number) => {
        setActivating(id)
        try {
            await api.activateAnalysis(id)
            // Fetch the full stats of the newly activated analysis and persist
            const stats = await api.getAnalysisStats(id)
            setDashboardStats(stats)
            await loadAnalyses()
        } catch (err) {
            console.error("Failed to activate analysis", err)
        } finally {
            setActivating(null)
        }
    }

    const handleDelete = async (id: number, isActive: boolean) => {
        if (!window.confirm("Сигурни ли сте, че искате да изтриете този анализ?")) return;

        setDeleting(id)
        try {
            await api.deleteAnalysis(id)
            await loadAnalyses()
            if (isActive) {
                // Since active was deleted, fetch the new one's stats
                const remainingData = await api.getAnalyses()
                const newActive = remainingData.find((a: AnalysisSummary) => a.is_active)
                if (newActive) {
                    const stats = await api.getAnalysisStats(newActive.id)
                    setDashboardStats(stats)
                } else {
                    setDashboardStats(null)
                }
            }
        } catch (err) {
            console.error("Failed to delete analysis", err)
        } finally {
            setDeleting(null)
        }
    }

    const handleExpand = async (id: number) => {
        if (expandedId === id) {
            setExpandedId(null)
            return
        }
        setExpandedId(id)
        if (!detailStats[id]) {
            try {
                const stats = await api.getAnalysisStats(id)
                setDetailStats(prev => ({ ...prev, [id]: stats }))
            } catch { /* ignore */ }
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <RefreshCw size={28} className="text-blue-400 animate-spin" />
                    <p className="text-white/40 text-sm">Зареждане на историята…</p>
                </div>
            </div>
        )
    }

    if (analyses.length === 0) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="text-center space-y-3">
                    <BarChart2 size={36} className="text-white/20 mx-auto" />
                    <p className="text-white/60 font-medium">Няма запазени анализи</p>
                    <p className="text-white/30 text-sm">Качете данни от страницата "Преглед", за да създадете първия анализ.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="h-full overflow-y-auto pr-1">
            <div className="space-y-6 pb-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-white">История на Анализите</h1>
                        <p className="text-sm text-white/40 mt-0.5">{analyses.length} запазен{analyses.length !== 1 ? "и анализа" : " анализ"}</p>
                    </div>
                    <button
                        onClick={loadAnalyses}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 text-white/50 hover:text-white hover:border-white/20 text-sm transition-colors"
                    >
                        <RefreshCw size={13} />
                        Обнови
                    </button>
                </div>

                {/* Analyses list */}
                <div className="space-y-3">
                    {analyses.map((analysis, idx) => (
                        <motion.div
                            key={analysis.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.04 }}
                            className={cn(
                                "rounded-xl border transition-colors overflow-hidden",
                                analysis.is_active
                                    ? "border-blue-500/30 bg-blue-500/5"
                                    : "border-white/8 bg-white/[0.02] hover:border-white/12"
                            )}
                        >
                            {/* Main row */}
                            <div className="flex items-center gap-4 p-4">
                                {/* Status dot */}
                                <div className={cn(
                                    "w-2.5 h-2.5 rounded-full shrink-0",
                                    analysis.is_active ? "bg-blue-400 animate-pulse" : "bg-white/15"
                                )} />

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold text-white/90 truncate">{analysis.name}</p>
                                        {analysis.is_active && (
                                            <span className="px-1.5 py-0.5 bg-blue-500/15 border border-blue-500/30 rounded text-[10px] text-blue-400 font-semibold uppercase tracking-wide shrink-0">
                                                Активен
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="flex items-center gap-1 text-xs text-white/30">
                                            <Clock size={10} /> {formatDate(analysis.created_at)}
                                        </span>
                                        <span className="text-white/20">·</span>
                                        <span className="text-xs text-white/30">от {analysis.created_by}</span>
                                    </div>
                                </div>

                                {/* Quick KPIs */}
                                <div className="hidden md:flex items-center gap-6 shrink-0">
                                    <div className="text-center">
                                        <p className="text-xs text-white/30 mb-0.5">Служители</p>
                                        <p className="text-sm font-bold text-white">{analysis.total_employees}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs text-white/30 mb-0.5">Висок Риск</p>
                                        <p className="text-sm font-bold text-red-400">{analysis.high_risk_count}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs text-white/30 mb-0.5">Avg Риск</p>
                                        <p className="text-sm font-bold text-amber-400">{(analysis.avg_risk * 100).toFixed(1)}%</p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 shrink-0">
                                    {!analysis.is_active && (
                                        <button
                                            onClick={() => handleActivate(analysis.id)}
                                            disabled={activating === analysis.id}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 text-xs font-semibold transition-colors disabled:opacity-50"
                                        >
                                            {activating === analysis.id
                                                ? <RefreshCw size={11} className="animate-spin" />
                                                : <Play size={11} />
                                            }
                                            Активирай
                                        </button>
                                    )}
                                    {analysis.is_active && (
                                        <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold">
                                            <CheckCircle2 size={11} /> Активен
                                        </div>
                                    )}
                                    <button
                                        onClick={() => handleDelete(analysis.id, analysis.is_active)}
                                        disabled={deleting === analysis.id}
                                        className="p-1.5 rounded-lg text-red-400/50 hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-50"
                                        title="Изтрий Анализ"
                                    >
                                        {deleting === analysis.id ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                    </button>
                                    <button
                                        onClick={() => handleExpand(analysis.id)}
                                        className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors"
                                    >
                                        {expandedId === analysis.id
                                            ? <X size={14} />
                                            : <ChevronDown size={14} />
                                        }
                                    </button>
                                </div>
                            </div>

                            {/* Expanded detail */}
                            <AnimatePresence>
                                {expandedId === analysis.id && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden border-t border-white/5"
                                    >
                                        {detailStats[analysis.id] ? (
                                            <div className="p-4 grid grid-cols-4 gap-4">
                                                {[
                                                    { label: "Всичко служители", value: detailStats[analysis.id].total_employees, icon: Users, color: "text-blue-400" },
                                                    { label: "Висок Риск", value: detailStats[analysis.id].high_risk_count, icon: AlertTriangle, color: "text-red-400" },
                                                    { label: "Среден Риск", value: `${((detailStats[analysis.id].avg_risk || 0) * 100).toFixed(1)}%`, icon: TrendingDown, color: "text-amber-400" },
                                                    { label: "Средна Заплата", value: `${((detailStats[analysis.id].avg_salary || 0) / 1000).toFixed(1)}K лв`, icon: BarChart2, color: "text-emerald-400" },
                                                ].map(({ label, value, icon: Icon, color }) => (
                                                    <div key={label} className="flex items-center gap-3 p-3 bg-white/[0.03] rounded-lg border border-white/5">
                                                        <Icon size={15} className={color} />
                                                        <div>
                                                            <p className="text-[10px] text-white/30 uppercase tracking-wide">{label}</p>
                                                            <p className="text-sm font-bold text-white">{value}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                                {/* Top risk factors */}
                                                {(detailStats[analysis.id].top_risk_factors || []).length > 0 && (
                                                    <div className="col-span-4 pt-3 border-t border-white/5">
                                                        <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold mb-2">Топ рискови фактори</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {(detailStats[analysis.id].top_risk_factors || []).map((f: any) => (
                                                                <span key={f.name} className="px-2 py-1 bg-white/5 border border-white/8 rounded text-xs text-white/60">
                                                                    {f.name.replace(/_/g, ' ')} <span className="text-white/30">+{f.impact.toFixed(3)}</span>
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="p-4 flex justify-center">
                                                <RefreshCw size={16} className="text-white/30 animate-spin" />
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    )
}
