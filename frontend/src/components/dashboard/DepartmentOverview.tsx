import * as React from "react"
import { Users, AlertTriangle, TrendingDown, Star, Building2, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui-core"
import { cn } from "../../lib/utils"
// @ts-ignore
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { api } from "../../services/api"
import { motion } from "framer-motion"

const FEATURE_LABELS: Record<string, string> = {
    "Overtime_Hours": "Извънреден труд",
    "Monthly_Salary": "Месечна заплата",
    "Employee_Satisfaction_Score": "Удовлетвореност",
    "Years_At_Company": "Стаж в компанията",
    "Performance_Score": "Представяне",
    "Work_Hours_Per_Week": "Работни часове/седмица",
    "Training_Hours": "Обучения (часове)",
    "Promotions": "Брой повишения",
    "Projects_Handled": "Брой проекти",
    "Sick_Days": "Болнични дни",
    "Remote_Work_Frequency": "Дистанционна работа",
    "Team_Size": "Размер на екипа",
    "Age": "Възраст",
}

interface DeptStats {
    department_name: string
    total_employees: number
    high_risk_count: number
    avg_risk: number
    avg_salary: number
    avg_satisfaction: number | null
    top_risk_factors: { name: string; impact: number }[]
    risk_distribution: { risk: number; count: number }[]
    no_data: boolean
}

export const DepartmentOverview = () => {
    const [stats, setStats] = React.useState<DeptStats | null>(null)
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState<string | null>(null)

    const loadStats = React.useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const data = await api.getDepartmentStats()
            setStats(data)
        } catch (err: any) {
            const msg = err?.response?.data?.detail ?? "Грешка при зареждане на данните"
            setError(msg)
        } finally {
            setLoading(false)
        }
    }, [])

    React.useEffect(() => { loadStats() }, [loadStats])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <RefreshCw size={28} className="text-blue-400 animate-spin" />
                    <p className="text-white/40 text-sm">Зареждане на данните за отдела…</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="text-center space-y-3">
                    <AlertTriangle size={36} className="text-amber-400 mx-auto" />
                    <p className="text-white/70 font-medium">{error}</p>
                    <p className="text-white/30 text-sm">Свържете се с HR мениджъра за да качи данни.</p>
                    <button onClick={loadStats} className="mt-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/8 border border-white/10 text-white/60 text-sm transition-colors">
                        Опитай отново
                    </button>
                </div>
            </div>
        )
    }

    if (!stats || stats.no_data) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="text-center space-y-3 max-w-sm">
                    <Building2 size={36} className="text-white/20 mx-auto" />
                    <p className="text-white/60 font-medium">Няма налични данни за вашия отдел</p>
                    <p className="text-white/30 text-sm">
                        HR мениджърът трябва да качи данни за служителите, след което ще видите обобщение тук.
                    </p>
                    <button onClick={loadStats} className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/8 border border-white/10 text-white/60 text-sm transition-colors">
                        Провери отново
                    </button>
                </div>
            </div>
        )
    }

    const highRiskPct = stats.total_employees > 0
        ? ((stats.high_risk_count / stats.total_employees) * 100).toFixed(0)
        : '0'

    const kpiCards = [
        {
            title: "Служители",
            value: stats.total_employees.toString(),
            icon: <Users className="h-5 w-5 text-blue-400" />,
            delta: `в отдел "${stats.department_name}"`,
            warning: false,
        },
        {
            title: "Висок Риск",
            value: stats.high_risk_count.toString(),
            icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
            delta: `${highRiskPct}% от отдела`,
            warning: true,
        },
        {
            title: "Среден Риск",
            value: `${(stats.avg_risk * 100).toFixed(1)}%`,
            icon: <TrendingDown className="h-5 w-5 text-orange-400" />,
            delta: "средна вероятност за напускане",
            warning: false,
        },
        {
            title: stats.avg_satisfaction != null ? "Удовлетвореност" : "Средна Заплата",
            value: stats.avg_satisfaction != null
                ? `${stats.avg_satisfaction.toFixed(1)} / 10`
                : `${(stats.avg_salary / 1000).toFixed(1)}K лв`,
            icon: <Star className="h-5 w-5 text-amber-400" />,
            delta: stats.avg_satisfaction != null ? "средна оценка в отдела" : "на служител/месец",
            warning: false,
        },
    ]

    const maxFactor = stats.top_risk_factors[0]?.impact || 1
    const factorColors = [
        { text: 'text-red-400', bar: 'bg-red-500' },
        { text: 'text-orange-400', bar: 'bg-orange-500' },
        { text: 'text-yellow-400', bar: 'bg-yellow-500' },
        { text: 'text-emerald-400', bar: 'bg-emerald-500' },
        { text: 'text-blue-400', bar: 'bg-blue-500' },
    ]

    return (
        <div className="h-full overflow-y-auto pr-2">
            <div className="space-y-6 animate-in fade-in duration-500 pb-8">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Building2 size={16} className="text-blue-400" />
                            <span className="text-xs font-semibold text-blue-400 uppercase tracking-widest">Вашият отдел</span>
                        </div>
                        <h1 className="text-2xl font-bold text-white">{stats.department_name}</h1>
                        <p className="text-white/40 text-sm">{stats.total_employees} служители</p>
                    </div>
                    <button
                        onClick={loadStats}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-white/50 hover:text-white hover:border-white/20 text-sm transition-colors"
                    >
                        <RefreshCw size={14} />
                        Обнови
                    </button>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-4 gap-4">
                    {kpiCards.map((card, i) => (
                        <motion.div
                            key={card.title}
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.07 }}
                            className={cn(
                                "relative overflow-hidden rounded-xl border p-5 flex flex-col justify-between transition-all hover:shadow-lg",
                                card.warning
                                    ? "bg-red-500/5 border-red-500/20 hover:border-red-500/40"
                                    : "bg-[#1A1D24] border-white/5 hover:border-blue-500/30"
                            )}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className={cn("p-2 rounded-lg bg-white/5 border border-white/5", card.warning && "bg-red-500/10 border-red-500/20")}>
                                    {card.icon}
                                </div>
                                {card.warning && <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />}
                            </div>
                            <div>
                                <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-1">{card.title}</p>
                                <h3 className="text-2xl font-bold text-white tracking-tight">{card.value}</h3>
                            </div>
                            <div className="mt-3">
                                <span className="text-[10px] text-white/30">{card.delta}</span>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-12 gap-6">
                    {/* Risk Distribution Chart */}
                    <div className="col-span-7">
                        <Card className="bg-[#1A1D24] border-white/5">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <div>
                                    <CardTitle className="text-lg text-white font-medium">Разпределение на Риска</CardTitle>
                                    <p className="text-xs text-white/40 mt-1">Брой служители по вероятност за напускане</p>
                                </div>
                                <div className="flex gap-2">
                                    <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> 0–30% Нисък
                                    </span>
                                    <span className="flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" /> 65%+ Висок
                                    </span>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[250px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart
                                            data={stats.risk_distribution}
                                            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                                        >
                                            <defs>
                                                <linearGradient id="deptRiskFill" x1="0" y1="0" x2="1" y2="0">
                                                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                                                    <stop offset="50%" stopColor="#f59e0b" stopOpacity={0.4} />
                                                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0.6} />
                                                </linearGradient>
                                                <linearGradient id="deptRiskStroke" x1="0" y1="0" x2="1" y2="0">
                                                    <stop offset="0%" stopColor="#10b981" />
                                                    <stop offset="50%" stopColor="#f59e0b" />
                                                    <stop offset="100%" stopColor="#ef4444" />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                            <XAxis
                                                dataKey="risk"
                                                stroke="rgba(255,255,255,0.2)"
                                                fontSize={10}
                                                tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                                                axisLine={false}
                                                tickLine={false}
                                                dy={10}
                                            />
                                            <YAxis
                                                stroke="rgba(255,255,255,0.2)"
                                                fontSize={10}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <Tooltip
                                                content={({ active, payload }) => {
                                                    if (active && payload && payload.length) {
                                                        const d = payload[0].payload
                                                        return (
                                                            <div className="bg-[#0F1117] border border-white/10 rounded-lg px-3 py-2 shadow-xl">
                                                                <p className="text-white text-sm font-medium">{(d.risk * 100).toFixed(0)}% риск</p>
                                                                <p className="text-white/60 text-xs">{d.count} служители</p>
                                                            </div>
                                                        )
                                                    }
                                                    return null
                                                }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="count"
                                                stroke="url(#deptRiskStroke)"
                                                strokeWidth={3}
                                                fillOpacity={1}
                                                fill="url(#deptRiskFill)"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Top Risk Factors */}
                    <div className="col-span-5">
                        <Card className="h-full bg-[#1A1D24] border-white/5 flex flex-col">
                            <CardHeader>
                                <CardTitle className="text-lg text-white font-medium">Топ Рискови Фактори</CardTitle>
                                <p className="text-xs text-white/40 mt-1">Фактори с най-голямо влияние в отдела</p>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col gap-3">
                                {stats.top_risk_factors.length === 0 ? (
                                    <p className="text-white/30 text-sm text-center mt-6">Няма налични данни</p>
                                ) : (
                                    stats.top_risk_factors.map((factor, idx) => {
                                        const c = factorColors[Math.min(idx, factorColors.length - 1)]
                                        const pct = (factor.impact / maxFactor) * 100
                                        return (
                                            <div key={factor.name} className="group p-2 rounded-lg hover:bg-white/[0.02] transition-colors">
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <span className="text-sm font-medium text-white/80">
                                                        {FEATURE_LABELS[factor.name] || factor.name}
                                                    </span>
                                                    <span className={cn("text-xs font-mono font-bold", c.text)}>
                                                        +{factor.impact.toFixed(3)}
                                                    </span>
                                                </div>
                                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${pct}%` }}
                                                        transition={{ duration: 0.7, delay: idx * 0.08 }}
                                                        className={cn("h-full rounded-full", c.bar)}
                                                    />
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
