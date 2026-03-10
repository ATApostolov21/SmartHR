import * as React from "react"
import { ArrowLeft, Activity, SlidersHorizontal, User, Heart, Zap, Target, DollarSign, Clock, Briefcase } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from "../ui-core"
import { api } from "../../services/api"
import { cn } from "../../lib/utils"
import { useAppState } from "../../lib/store"
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'
import { motion } from 'framer-motion'

const FACTOR_INFO: Record<string, { label: string, category: string }> = {
    "Monthly_Salary": { label: "Месечна заплата", category: "compensation" },
    "Overtime_Hours": { label: "Извънреден труд", category: "workload" },
    "Remote_Work_Frequency": { label: "Дистанционна работа", category: "flexibility" },
    "Training_Hours": { label: "Часове обучение", category: "growth" },
    "Sick_Days": { label: "Болнични дни", category: "health" },
    "Work_Hours_Per_Week": { label: "Работни часове", category: "workload" },
    "Projects_Handled": { label: "Брой проекти", category: "workload" },
    "Years_At_Company": { label: "Стаж в компанията", category: "tenure" },
    "Promotions": { label: "Брой промоции", category: "growth" },
    "Performance_Score": { label: "Оценка на представянето", category: "performance" },
    "Age": { label: "Възраст", category: "demographics" },
    "Gender": { label: "Пол", category: "demographics" },
    "Education_Level": { label: "Образование", category: "demographics" },
    "Team_Size": { label: "Размер на екипа", category: "environment" }
}

const getRecommendationForFactor = (factor: string, impact: number, employeeVal: any, avgVal: any) => {
    // Only care about negative impacts (causing churn)
    if (impact < 0) return null;

    switch (factor) {
        case 'Monthly_Salary':
            return {
                title: "Финансово Стимулиране",
                icon: <DollarSign className="w-4 h-4" />,
                color: "blue",
                content: `Текущата заплата (${employeeVal} лв) създава висок риск. Увеличение с 10-15% (към средно ${Math.round(avgVal)} лв) може да неутрализира този драйвер.`
            };
        case 'Overtime_Hours':
        case 'Work_Hours_Per_Week':
        case 'Projects_Handled':
            return {
                title: "Баланс Работа-Живот",
                icon: <Heart className="w-4 h-4" />,
                color: "emerald",
                content: `Критично натоварване (${factor === 'Projects_Handled' ? employeeVal + ' проекта' : employeeVal + ' часа'}). Препоръчваме редуциране и делегиране към други членове на екипа.`
            };
        case 'Training_Hours':
        case 'Promotions':
            return {
                title: "Кариерно Развитие",
                icon: <Zap className="w-4 h-4" />,
                color: "purple",
                content: `Липсата на растеж е ключов риск. Планирайте нова обучителна програма или обсъдете кариерна пътека до 1 месец.`
            };
        case 'Remote_Work_Frequency':
            return {
                title: "Гъвкавост",
                icon: <Briefcase className="w-4 h-4" />,
                color: "amber",
                content: `Нужда от повече гъвкавост. Увеличаването на дните за работа от вкъщи може значително да подобри удовлетвореността.`
            };
        default:
            return {
                title: FACTOR_INFO[factor]?.label || factor,
                icon: <Activity className="w-4 h-4" />,
                color: "gray",
                content: `Този фактор оказва силно негативно влияние. Препоръчва се мениджърски разговор за изясняване на проблема.`
            };
    }
}

export const DeepAnalysis = ({ employeeId, onBack }: { employeeId: number, onBack: () => void }) => {
    const { setActiveTab } = useAppState()
    const [data, setData] = React.useState<any>(null)
    const [loading, setLoading] = React.useState(true)

    React.useEffect(() => {
        const fetchAnalysis = async () => {
            try {
                const result = await api.getAnalysis(employeeId)
                setData(result)
            } catch (err) {
                console.error("Failed to fetch analysis", err)
            } finally {
                setLoading(false)
            }
        };
        fetchAnalysis()
    }, [employeeId])

    if (loading) return (
        <div className="h-full flex flex-col items-center justify-center space-y-6 text-white/40">
            <div className="relative">
                <div className="w-16 h-16 rounded-full border-2 border-brand-accent1/20 border-t-brand-accent1 animate-spin" />
                <Activity className="absolute inset-0 m-auto h-6 w-6 text-brand-accent1 animate-pulse" />
            </div>
            <div className="text-center space-y-2">
                <span className="text-sm font-black uppercase tracking-[0.2em] text-brand-accent1">Анализиране</span>
                <p className="text-[10px] text-white/20 uppercase tracking-widest">Обработка на невронни мрежи...</p>
            </div>
        </div>
    )

    if (!data) return <div className="p-6 text-red-400">Грешка при зареждане на данните.</div>

    const { employee, top_factors, avg_comparison } = data

    // Radar Data
    const competencyData = [
        { subject: 'Лидерство', A: Math.min(100, (employee.Performance_Score * 15) + (employee.Years_At_Company * 3)), fullMark: 100 },
        { subject: 'Комуникация', A: 82, fullMark: 100 },
        { subject: 'Техн. умени', A: 94, fullMark: 100 },
        { subject: 'Продуктивност', A: Math.min(100, employee.Projects_Handled * 8 + 40), fullMark: 100 },
        { subject: 'Стабилност', A: Math.min(100, 100 - (employee.churn_probability * 100)), fullMark: 100 },
        { subject: 'Адаптивност', A: 78, fullMark: 100 },
    ]

    const isHighRisk = employee.churn_probability >= 0.65;
    const isMidRisk = employee.churn_probability >= 0.35 && employee.churn_probability < 0.65;

    // Generate actionable recommendations from the specific employee's top negative factors
    const recommendations = top_factors
        .map((factor: any) => getRecommendationForFactor(factor.feature, factor.impact, employee[factor.feature], avg_comparison[factor.feature]))
        .filter((rec: any) => rec !== null)
        .slice(0, 4); // Show top 2-4 critical recommendations.

    return (
        <div className="h-full flex flex-col min-h-0 bg-[#0d0f18]/10">
            {/* Header section with profile overview */}
            <div className="px-6 py-8 space-y-8">
                {/* Navigation & Status */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-white transition-colors group"
                    >
                        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                        Назад към списъка
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Прогнозен Статус</span>
                            <span className={cn(
                                "text-xs font-black uppercase tracking-wider",
                                isHighRisk ? "text-red-400" : isMidRisk ? "text-amber-400" : "text-emerald-400"
                            )}>
                                {isHighRisk ? "Критичен Риск" : isMidRisk ? "Повишено Внимание" : "Стабилен"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Main Profile Info */}
                <div className="flex items-start gap-6">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-brand-accent1/20 blur-2xl rounded-full scale-50 group-hover:scale-100 transition-transform duration-500" />
                        <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-white/10 to-white/[0.02] border border-white/10 flex items-center justify-center shadow-2xl backdrop-blur-xl">
                            <User className="w-10 h-10 text-brand-accent1" />
                            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-[#0d0f18] border border-white/5 flex items-center justify-center shadow-lg">
                                <span className="text-[10px] font-bold text-white/60">#{employeeId}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 pt-2">
                        <h2 className="text-4xl font-black text-white tracking-tighter leading-none mb-3">
                            {employee.Job_Title}
                        </h2>
                        <div className="flex flex-wrap items-center gap-4">
                            <Badge variant="outline" className="h-7 px-4 rounded-full border-brand-accent1/20 bg-brand-accent1/5 text-brand-accent1 text-[10px] font-black uppercase tracking-widest">
                                {employee.Department}
                            </Badge>
                            <div className="flex items-center gap-4 text-white/30 text-[10px] font-bold uppercase tracking-widest">
                                <span className="flex items-center gap-2"><Clock className="w-3 h-3" /> {employee.Years_At_Company} г. стаж</span>
                                <span className="w-1 h-1 rounded-full bg-white/10" />
                                <span className="flex items-center gap-2"><Briefcase className="w-3 h-3" /> {employee.Projects_Handled} проекта</span>
                            </div>
                        </div>
                    </div>

                    <div className="text-right">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-2">Вероятност от напускане</div>
                        <div className={cn(
                            "text-6xl font-black tracking-tighter",
                            isHighRisk ? "text-red-400" : isMidRisk ? "text-amber-400" : "text-emerald-400"
                        )}>
                            {(employee.churn_probability * 100).toFixed(0)}<span className="text-2xl ml-1 font-bold opacity-40">%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto px-6 pb-20 space-y-8 scrollbar-hide">

                {/* 1. Actionable Insights - The "Meat" for HR Managers */}
                <Card className="bg-white/[0.02] border-white/5 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-3xl">
                    <CardHeader className="border-b border-white/5 bg-white/[0.02] py-5 px-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-brand-accent1/10 border border-brand-accent1/20">
                                    <Zap className="w-5 h-5 text-brand-accent1" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-black uppercase tracking-wider text-white/90">AI Препоръки за Задържане</CardTitle>
                                    <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Следващи стъпки за мениджъра</p>
                                </div>
                            </div>
                            <Button
                                onClick={() => setActiveTab('simulator')}
                                className="h-10 px-5 rounded-xl bg-brand-accent1 hover:bg-brand-accent1/90 text-[10px] font-black uppercase tracking-widest gap-2"
                            >
                                <SlidersHorizontal className="w-3.5 h-3.5" />
                                Тествай стратегия
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {recommendations.length > 0 ? recommendations.map((rec: any, idx: number) => (
                                <InsightCard
                                    key={idx}
                                    icon={rec.icon}
                                    title={rec.title}
                                    content={rec.content}
                                    color={rec.color}
                                />
                            )) : (
                                <div className="col-span-1 md:col-span-2 p-6 rounded-2xl border border-white/5 bg-white/[0.02] text-center">
                                    <Heart className="w-8 h-8 text-emerald-500 mx-auto mb-3 opacity-50" />
                                    <p className="text-white/60 text-sm font-medium">Профилът е стабилен. Няма установени критични драйвери, изискващи спешна намеса.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 2. Competency Radar */}
                    <Card className="bg-white/[0.02] border-white/5 rounded-3xl backdrop-blur-xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Компетентностен Модел</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[280px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={competencyData}>
                                    <defs>
                                        <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#4f7ef7" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#4f7ef7" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <PolarGrid stroke="rgba(255,255,255,0.05)" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 'bold' }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                    <Radar
                                        name="Level"
                                        dataKey="A"
                                        stroke="#4f7ef7"
                                        strokeWidth={3}
                                        fill="url(#radarGradient)"
                                        fillOpacity={1}
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* 3. Risk Drivers */}
                    <Card className="bg-white/[0.02] border-white/5 rounded-3xl backdrop-blur-xl">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Топ Рискови Драйвери (SHAP)</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            {top_factors.map((factor: any, idx: number) => (
                                <div key={idx} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-black uppercase tracking-tight text-white/60">
                                            {FACTOR_INFO[factor.feature]?.label || factor.feature.replace(/_/g, ' ')}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <span className={cn(
                                                "text-[10px] font-bold px-1.5 py-0.5 rounded",
                                                factor.impact > 0 ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500"
                                            )}>
                                                {factor.impact > 0 ? "+" : ""}{(factor.impact * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-[1px]">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(100, Math.abs(factor.impact) * 200)}%` }}
                                            transition={{ duration: 1, delay: idx * 0.1 }}
                                            className={cn(
                                                "h-full rounded-full relative overflow-hidden",
                                                factor.impact > 0 ? "bg-red-500" : "bg-emerald-500"
                                            )}
                                        >
                                            <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)' }} />
                                        </motion.div>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* 4. Market Benchmarking */}
                <Card className="bg-white/[0.02] border-white/5 rounded-3xl backdrop-blur-xl p-6">
                    <div className="flex items-center gap-2 mb-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                        <Target className="w-4 h-4" /> Бенчмарк Спрямо Отдела ({employee.Department})
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <BenchmarkItem
                            label="Месечна заплата"
                            value={employee.Monthly_Salary}
                            avg={avg_comparison.Monthly_Salary}
                            unit="лв"
                        />
                        <BenchmarkItem
                            label="Извънреден труд"
                            value={employee.Overtime_Hours}
                            avg={avg_comparison.Overtime_Hours}
                            unit="ч/мес"
                        />
                    </div>
                </Card>

            </div>
        </div>
    )
}

const InsightCard = ({ icon, title, content, color }: any) => (
    <div className={cn(
        "p-4 rounded-2xl border transition-all cursor-default group",
        color === 'blue' ? "bg-blue-500/[0.03] border-blue-500/10 hover:border-blue-500/20" : "bg-emerald-500/[0.03] border-emerald-500/10 hover:border-emerald-500/20"
    )}>
        <div className="flex items-center gap-3 mb-2">
            <div className={cn(
                "p-1.5 rounded-lg border",
                color === 'blue' ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
            )}>
                {icon}
            </div>
            <h4 className="text-[10px] font-black uppercase tracking-wider text-white/80">{title}</h4>
        </div>
        <p className="text-xs text-white/40 leading-relaxed font-medium group-hover:text-white/60 transition-colors">{content}</p>
    </div>
)

const BenchmarkItem = ({ label, value, avg, unit }: any) => {
    const isHigher = value > avg;
    const diff = Math.abs(((value - avg) / avg) * 100).toFixed(0);
    const percentage = (value / (avg * 2)) * 100; // Normalized for comparison

    return (
        <div className="space-y-4">
            <div className="flex items-end justify-between">
                <div className="space-y-1">
                    <span className="text-[11px] font-black uppercase tracking-tight text-white/60">{label}</span>
                    <div className="text-2xl font-black text-white">{value.toLocaleString()}<span className="text-[10px] text-white/20 ml-1 uppercase">{unit}</span></div>
                </div>
                <div className="text-right">
                    <div className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-1">Разлика</div>
                    <div className={cn(
                        "text-xs font-black uppercase tracking-wider px-2 py-1 rounded-lg border",
                        isHigher ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-white/5 border-white/10 text-white/40"
                    )}>
                        {isHigher ? "+" : "-"}{diff}%
                    </div>
                </div>
            </div>
            <div className="relative h-2 w-full bg-white/5 rounded-full border border-white/5 p-[1px]">
                {/* Average Marker */}
                <div
                    className="absolute top-1/2 -translate-y-1/2 w-[2px] h-4 bg-white/20 z-10"
                    style={{ left: '50%' }}
                >
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[8px] font-bold text-white/20 uppercase whitespace-nowrap">Средно ({Math.round(avg)})</div>
                </div>
                {/* Value Bar */}
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, percentage)}%` }}
                    transition={{ duration: 1.5, ease: "circOut" }}
                    className={cn(
                        "h-full rounded-full",
                        isHigher ? "bg-brand-accent1" : "bg-white/20"
                    )}
                />
            </div>
        </div>
    )
}
