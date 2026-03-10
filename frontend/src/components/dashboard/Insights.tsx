import { useState, useMemo } from "react"
import { TrendingUp, BarChart2, DollarSign, Target, Lightbulb, ChevronDown, Briefcase, Award } from "lucide-react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "../ui-core"
import { useAppState } from "../../lib/store"
// @ts-ignore
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area, LineChart, Line, Cell } from 'recharts'

const FEATURE_LABELS: Record<string, string> = {
    "Overtime_Hours": "Извънреден труд",
    "Monthly_Salary": "Месечна заплата",
    "Employee_Satisfaction_Score": "Удовлетвореност",
    "Years_At_Company": "Стаж в компанията",
    "Performance_Score": "Представяне",
    "Work_Hours_Per_Week": "Работни часове",
    "Training_Hours": "Обучения",
    "Promotions": "Повишения",
    "Projects_Handled": "Брой проекти",
    "Sick_Days": "Болнични дни",
    "Remote_Work_Frequency": "Дистанционна работа",
    "Team_Size": "Размер на екипа",
    "Age": "Възраст",
}

export const Insights = () => {
    const { dashboardStats } = useAppState()
    const [selectedDept, setSelectedDept] = useState<string | "ALL">("ALL")

    if (!dashboardStats) {
        return (
            <div className="flex flex-col items-center justify-center p-12 mt-12 mb-8 bg-[#0d0f18]/40 border border-white/5 rounded-[2rem]">
                <BarChart2 size={48} className="text-white/20 mb-4" />
                <p className="text-white/60 font-black text-xl mb-2">Няма данни за анализ</p>
                <p className="text-white/30 text-sm font-medium">Качете данни в прегледа, за да генерирате стратегически прозрения.</p>
            </div>
        )
    }

    const deptRiskData = useMemo(() => {
        return Object.entries(dashboardStats.risk_by_department || {}).map(([name, risk]) => ({
            name,
            risk: Math.round((risk as number) * 100)
        })).sort((a, b) => b.risk - a.risk);
    }, [dashboardStats])

    const tenureRiskData = useMemo(() => {
        return Object.entries(dashboardStats.risk_by_tenure || {}).map(([name, risk]) => ({
            name,
            risk: Math.round((risk as number) * 100)
        }));
    }, [dashboardStats])

    const departmentsList = useMemo(() => {
        return Object.keys(dashboardStats.departments || {})
    }, [dashboardStats])

    const churnFactors = useMemo(() => {
        const factors = selectedDept !== "ALL"
            ? (dashboardStats.factors_by_department?.[selectedDept] || [])
            : (dashboardStats.top_risk_factors || [])

        return factors.map((f: any) => ({
            name: FEATURE_LABELS[f.name] || f.name.replace(/_/g, ' '),
            value: Math.round(f.impact * 100) || 10
        }));
    }, [dashboardStats, selectedDept])

    const satisfactionRiskData = useMemo(() => {
        const rawData = dashboardStats.risk_by_satisfaction || {};
        const entries = Object.entries(rawData);

        if (entries.length === 0) return [];

        return entries.map(([score, risk]) => ({
            name: `${score}/5`,
            score_num: parseFloat(score),
            risk: Math.round((risk as number) * 100)
        })).sort((a, b) => a.score_num - b.score_num);
    }, [dashboardStats])

    // --- Dynamic Calculations Based on Selection ---

    // Fallback global values
    const globalTotalEmployees = dashboardStats.total_employees || 0
    const globalHighRisk = dashboardStats.high_risk_count || 0
    const globalAvgSalary = dashboardStats.avg_salary || 0
    const highPerformersAtRisk = dashboardStats.high_performer_risk_count || 0
    const projectsAtRisk = dashboardStats.projects_at_risk || 0

    const displayedAvgSalary = selectedDept !== "ALL"
        ? (dashboardStats.avg_salary_by_department?.[selectedDept] || globalAvgSalary)
        : globalAvgSalary

    const displayedHighPerformers = selectedDept !== "ALL"
        ? (dashboardStats.high_performer_risk_by_dept?.[selectedDept] || 0)
        : highPerformersAtRisk

    const displayedProjectsAtRisk = selectedDept !== "ALL"
        ? (dashboardStats.projects_at_risk_by_dept?.[selectedDept] || 0)
        : projectsAtRisk

    const deptHeadcount = selectedDept !== "ALL"
        ? (dashboardStats.departments?.[selectedDept] || 0)
        : globalTotalEmployees

    const deptRisk = selectedDept !== "ALL"
        ? (dashboardStats.risk_by_department?.[selectedDept] || 0)
        : (dashboardStats.avg_risk || 0)

    const estimatedHighRisk = selectedDept !== "ALL"
        ? Math.round(deptHeadcount * deptRisk)
        : globalHighRisk

    const topDriver = churnFactors[0] || { name: 'N/A', value: 0 };

    // Cost of turnover calculation (Estimated 6 months salary to replace)
    const replacementCostMultiplier = 6
    const estimatedTurnoverCost = estimatedHighRisk * (globalAvgSalary * replacementCostMultiplier)

    const maxRiskDept = deptRiskData[0] || { name: 'N/A', risk: 0 };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 block">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-brand-accent1/10 flex items-center justify-center border border-brand-accent1/20 shadow-[0_0_30px_rgba(79,126,247,0.15)]">
                            <Lightbulb className="text-brand-accent1 w-5 h-5" />
                        </div>
                        <h2 className="text-3xl font-black text-white tracking-tighter">Стратегически Прозрения</h2>
                    </div>
                    <p className="text-white/40 text-sm font-medium ml-14">Бизнес метрики, капацитет и финансов анализ на риска от текучество.</p>
                </div>

                {/* Department Filter */}
                {departmentsList.length > 0 && (
                    <div className="relative group">
                        <select
                            value={selectedDept}
                            onChange={(e) => setSelectedDept(e.target.value)}
                            className="appearance-none bg-[#0d0f18]/60 backdrop-blur-md border border-white/10 text-white font-bold text-sm rounded-xl px-5 py-3 pr-10 focus:outline-none focus:border-brand-accent1/50 focus:ring-1 focus:ring-brand-accent1/50 transition-all cursor-pointer shadow-xl min-w-[200px]"
                        >
                            <option value="ALL">Всички Отдели ({globalTotalEmployees} профила)</option>
                            {departmentsList.map(dept => (
                                <option key={dept} value={dept}>{dept} ({(dashboardStats.departments as any)[dept]} души)</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none group-hover:text-white transition-colors" />
                    </div>
                )}
            </div>

            {/* Financial & Business Impact Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-emerald-500/10 to-[#0d0f18] border-emerald-500/20 shadow-[0_8px_32px_rgba(16,185,129,0.1)] relative overflow-hidden group rounded-[2rem]">
                    <div className="absolute top-0 right-0 p-6 opacity-[0.05] group-hover:scale-110 transition-transform duration-500 pointer-events-none">
                        <DollarSign size={80} />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                            <DollarSign className="h-4 w-4" /> Средна Заплата
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-3xl font-black text-white tabular-nums tracking-tighter">
                                {(displayedAvgSalary / 1000).toFixed(1)}K
                            </span>
                            <span className="text-xs font-bold text-white/40">лв</span>
                        </div>
                        <p className="text-[10px] text-white/50 leading-relaxed font-medium mt-2">
                            Текущо месечно възнаграждение за <span className="text-emerald-400 font-bold">{selectedDept === 'ALL' ? 'всички отдели' : `отдел ${selectedDept}`}</span> (Филтрирано).
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500/10 to-[#0d0f18] border-purple-500/20 shadow-[0_8px_32px_rgba(168,85,247,0.1)] relative overflow-hidden group rounded-[2rem]">
                    <div className="absolute top-0 right-0 p-6 opacity-[0.05] group-hover:scale-110 transition-transform duration-500 pointer-events-none">
                        <Award size={80} />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-purple-400 uppercase tracking-widest flex items-center gap-2">
                            <Award className="h-4 w-4" /> Топ Таланти в Риск
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-3xl font-black text-white tabular-nums tracking-tighter">
                                {displayedHighPerformers}
                            </span>
                            <span className="text-xs font-bold text-white/40">души</span>
                        </div>
                        <p className="text-[10px] text-white/50 leading-relaxed font-medium mt-2">
                            Служители с високо представяне (&gt;3.5 рейтинг), които търсят нови възможности.
                            {selectedDept !== 'ALL' && <span className="text-purple-400 font-bold block mt-1">В {selectedDept}</span>}
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-500/10 to-[#0d0f18] border-amber-500/20 shadow-[0_8px_32px_rgba(245,158,11,0.1)] relative overflow-hidden group rounded-[2rem]">
                    <div className="absolute top-0 right-0 p-6 opacity-[0.05] group-hover:scale-110 transition-transform duration-500 pointer-events-none">
                        <Briefcase size={80} />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2">
                            <Briefcase className="h-4 w-4" /> Проекти в Риск
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-3xl font-black text-white tabular-nums tracking-tighter">
                                {displayedProjectsAtRisk}
                            </span>
                            <span className="text-xs font-bold text-white/40">проекта</span>
                        </div>
                        <p className="text-[10px] text-white/50 leading-relaxed font-medium mt-2">
                            Активни задачи, уязвими от потенциално напускане на ключов персонал.
                            {selectedDept !== 'ALL' && <span className="text-amber-500 font-bold block mt-1">В {selectedDept}</span>}
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-brand-accent1/10 to-[#0d0f18] border-brand-accent1/20 shadow-[0_8px_32px_rgba(79,126,247,0.1)] relative overflow-hidden group rounded-[2rem]">
                    <div className="absolute top-0 right-0 p-6 opacity-[0.05] group-hover:scale-110 transition-transform duration-500 pointer-events-none">
                        <Target size={80} />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-brand-accent1 uppercase tracking-widest flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" /> Главен Драйвер
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-black text-white mb-1 tracking-tight leading-tight pt-1.5 truncate pr-8">{topDriver.name}</div>
                        <p className="text-[10px] text-white/50 leading-relaxed font-medium mt-2">
                            Най-влиятелният фактор, причиняващ напускане
                            {selectedDept !== 'ALL' ? ` в отдел ${selectedDept}.` : " в цялата компания."}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
                {/* Department Risk Analysis */}
                <Card className="col-span-1 lg:col-span-2 bg-[#0d0f18]/60 backdrop-blur-xl border border-white/5 shadow-2xl rounded-[2rem] overflow-hidden">
                    <CardHeader className="flex flex-row items-start justify-between p-8 pb-4">
                        <div className="space-y-1">
                            <CardTitle className="text-xl font-black text-white tracking-tight">Анализ: Отдели срещу Стаж</CardTitle>
                            <p className="text-sm text-white/30 font-medium">Къде и кога компанията губи таланти</p>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 pt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-[280px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={deptRiskData.slice(0, 5)} layout="vertical" margin={{ left: -10, right: 30 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" horizontal={false} />
                                    <XAxis type="number" hide domain={[0, 100]} />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        stroke="rgba(255,255,255,0.4)"
                                        fontSize={10}
                                        fontWeight={600}
                                        width={90}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <RechartsTooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const data = payload[0].payload
                                                return (
                                                    <div className="bg-[#09090f]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl">
                                                        <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1">{data.name}</p>
                                                        <div className="flex items-baseline gap-1">
                                                            <span className="text-xl font-black text-white">{data.risk}%</span>
                                                            <span className="text-red-400 font-bold ml-1 text-[10px]">Среден риск</span>
                                                        </div>
                                                    </div>
                                                )
                                            }
                                            return null
                                        }}
                                    />
                                    <Bar dataKey="risk" radius={[0, 4, 4, 0]} barSize={16}>
                                        {deptRiskData.slice(0, 5).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.risk > 40 ? '#ef4444' : '#3b82f6'} fillOpacity={0.8} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>

                            {tenureRiskData.length > 0 && (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={tenureRiskData} margin={{ left: -20, right: 10, top: 10, bottom: 20 }}>
                                        <defs>
                                            <linearGradient id="colorTenure" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#4f7ef7" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#4f7ef7" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                                        <XAxis
                                            dataKey="name"
                                            stroke="rgba(255,255,255,0.4)"
                                            fontSize={10}
                                            tickLine={false}
                                            axisLine={false}
                                            dy={10}
                                        />
                                        <YAxis hide domain={[0, 100]} />
                                        <RechartsTooltip
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    const data = payload[0].payload
                                                    return (
                                                        <div className="bg-[#09090f]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl">
                                                            <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1">Група по стаж</p>
                                                            <div className="flex items-baseline gap-1">
                                                                <span className="text-xl font-black text-white">{data.risk}%</span>
                                                                <span className="text-brand-accent1 font-bold ml-1 text-[10px]">Среден риск</span>
                                                            </div>
                                                        </div>
                                                    )
                                                }
                                                return null
                                            }}
                                        />
                                        <Area type="monotone" dataKey="risk" stroke="#4f7ef7" strokeWidth={3} fillOpacity={1} fill="url(#colorTenure)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Churn Drivers / Satisfaction Analysis */}
                <Card className="col-span-1 bg-[#0d0f18]/60 backdrop-blur-xl border border-white/5 shadow-2xl rounded-[2rem] overflow-hidden">
                    <CardHeader className="p-8 pb-0">
                        <CardTitle className="text-base font-black text-white tracking-tight">Риск спрямо Удовлетвореност</CardTitle>
                        <p className="text-[10px] text-white/40 mt-1">Как оценката влияе на текучеството</p>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={satisfactionRiskData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 600 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 600 }}
                                        tickFormatter={(value) => `${value}%`}
                                    />
                                    <RechartsTooltip
                                        contentStyle={{ backgroundColor: '#0F1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                                        itemStyle={{ color: '#818cf8' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="risk"
                                        stroke="url(#lineGradient)"
                                        strokeWidth={4}
                                        dot={{ r: 4, fill: '#818cf8', strokeWidth: 2, stroke: '#0F1117' }}
                                        activeDot={{ r: 6, fill: '#818cf8', strokeWidth: 0 }}
                                        animationDuration={1500}
                                    />
                                    <defs>
                                        <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                                            <stop offset="0%" stopColor="#6366f1" />
                                            <stop offset="100%" stopColor="#a855f7" />
                                        </linearGradient>
                                    </defs>
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-4 relative overflow-hidden rounded-[2.5rem] border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 to-teal-500/5 p-8 flex flex-col md:flex-row items-center gap-8 group shadow-2xl"
            >
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity -mr-20 -mt-20 pointer-events-none" />

                <div className="w-16 h-16 shrink-0 rounded-[1.5rem] bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-[0_0_40px_rgba(16,185,129,0.4)] relative z-10 group-hover:scale-110 transition-transform duration-500">
                    <Target size={32} />
                </div>

                <div className="flex-1 space-y-2 relative z-10">
                    <h3 className="text-xl font-black text-white tracking-tight">Стратегия за Задържане</h3>
                    <p className="text-white/70 text-sm font-medium leading-relaxed max-w-4xl">
                        Въз основа на AI анализа, приоритетната ви цел трябва да бъде редуцирането на
                        <strong className="text-white"> {topDriver.name} </strong> в критичните звена като
                        <strong className="text-white"> {maxRiskDept.name}</strong>, особено сред топ талантите ви (в момента губите ключова компетентност по
                        <strong className="text-white"> {displayedProjectsAtRisk} проекта</strong>).
                        Ако намалите този рисков фактор с 15%, можете да спестите приблизително
                        <span className="inline-flex mx-1 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-black border border-emerald-500/30">
                            {((estimatedTurnoverCost * 0.15) / 1000000).toFixed(1)} млн. лв
                        </span>
                        годишно.
                    </p>
                </div>
            </motion.div>
        </div>
    )
}
