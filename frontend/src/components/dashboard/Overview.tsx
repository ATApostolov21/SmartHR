import * as React from "react"
import { Users, AlertTriangle, TrendingDown, DollarSign, UploadCloud, ArrowRight, RefreshCw, BarChart3, Info, AlertOctagon } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from "../ui-core"
import { api } from "../../services/api"
import { useAppState } from "../../lib/store"
import { cn } from "../../lib/utils"
import { GlobalShapDetails } from "./GlobalShapDetails"
import { Insights } from "./Insights"
// @ts-ignore
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

// Feature name translations (English column names to Bulgarian)
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

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
}

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
} as any

export const Overview = () => {
    const { dashboardStats, setDashboardStats } = useAppState()
    const [loading, setLoading] = React.useState(false)
    const [file, setFile] = React.useState<File | null>(null)
    const [previewLoading, setPreviewLoading] = React.useState(false)
    const [previewData, setPreviewData] = React.useState<{ columns: string[], preview_data: any[], total_rows: number } | null>(null)
    const [showShapDetails, setShowShapDetails] = React.useState(false)

    // Automatically fetch preview when a file is selected
    React.useEffect(() => {
        const fetchPreview = async () => {
            if (!file) {
                setPreviewData(null)
                return
            }
            setPreviewLoading(true)
            try {
                const data = await api.previewData(file)
                setPreviewData(data)
            } catch (err) {
                console.error("Preview failed", err)
                setPreviewData(null)
            } finally {
                setPreviewLoading(false)
            }
        }
        fetchPreview()
    }, [file])

    const handleUpload = async () => {
        if (!file) return
        setLoading(true)
        try {
            const result = await api.uploadData(file)
            setDashboardStats(result)
            setFile(null)
        } catch (err) {
            console.error("Upload failed", err)
        } finally {
            setLoading(false)
        }
    }

    // Get translated factor label
    const getFactorLabel = (name: string) => FEATURE_LABELS[name] || name

    // Determine color based on index
    const getFactorColors = (_impact: number, index: number) => {
        const colors = [
            { text: "text-red-400", bar: "bg-gradient-to-r from-red-600 to-orange-500", glow: "rgba(239,68,68,0.4)" },
            { text: "text-orange-400", bar: "bg-gradient-to-r from-orange-500 to-amber-500", glow: "rgba(245,158,11,0.3)" },
            { text: "text-yellow-400", bar: "bg-gradient-to-r from-yellow-500 to-lime-500", glow: "rgba(234,179,8,0.2)" },
            { text: "text-emerald-400", bar: "bg-gradient-to-r from-emerald-500 to-teal-500", glow: "rgba(16,185,129,0.2)" },
        ]
        return colors[Math.min(index, colors.length - 1)]
    }

    return (
        <div className="h-full overflow-y-auto pr-2 custom-scrollbar relative">
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-8 pb-12"
            >
                {!dashboardStats ? (
                    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-160px)] py-12">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="relative max-w-xl w-full"
                        >
                            <div className="relative p-12 bg-[#0d0f18]/60 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 shadow-[0_32px_128px_-16px_rgba(0,0,0,0.6)] flex flex-col items-center text-center space-y-8 overflow-hidden group">
                                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-accent1/30 to-transparent" />

                                <div className="h-24 w-24 rounded-3xl bg-brand-accent1/10 flex items-center justify-center border border-brand-accent1/20 group-hover:scale-110 group-hover:bg-brand-accent1/15 transition-all duration-700 shadow-[0_0_40px_rgba(79,126,247,0.1)]">
                                    <UploadCloud className="h-12 w-12 text-brand-accent1 animate-pulse" />
                                </div>

                                <div className="space-y-3">
                                    <h2 className="text-4xl font-black text-white tracking-tighter leading-tight">
                                        HR Intelligence <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent1 to-brand-accent2">AI Core</span>
                                    </h2>
                                    <p className="text-white/40 text-base max-w-sm mx-auto font-medium leading-relaxed">
                                        Интегрирайте своите HR данни, за да разкриете скритите тенденции и да предвидите риска от напускане.
                                    </p>
                                </div>

                                <div className="w-full pt-4 space-y-5">
                                    <input
                                        type="file"
                                        className="hidden"
                                        id="file-upload"
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    />
                                    <div className="flex flex-col gap-4">
                                        <label
                                            htmlFor="file-upload"
                                            className="w-full py-5 px-6 border-2 border-white/5 bg-white/[0.02] border-dashed rounded-2xl cursor-pointer hover:bg-white/[0.04] hover:border-brand-accent1/40 transition-all group/label flex items-center justify-center gap-4 text-white/50 hover:text-white"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover/label:bg-brand-accent1/20 group-hover/label:text-brand-accent1 transition-colors">
                                                <Info size={16} />
                                            </div>
                                            <span className="text-sm font-bold tracking-tight">{file ? file.name : "Изберете CSV или Excel файл"}</span>
                                        </label>

                                        <Button
                                            onClick={handleUpload}
                                            disabled={!file || loading || previewLoading}
                                            className="w-full bg-gradient-to-r from-brand-accent1 to-brand-accent3 hover:brightness-110 text-white h-14 rounded-2xl shadow-[0_8px_32px_rgba(79,126,247,0.25)] font-black text-base transition-all active:scale-[0.98] disabled:opacity-50 flex gap-2"
                                        >
                                            {loading ? <RefreshCw className="animate-spin h-5 w-5" /> : "Анализирай Данните"}
                                            {!loading && <ArrowRight size={18} />}
                                        </Button>
                                    </div>

                                    {/* Preview Table Section */}
                                    <AnimatePresence>
                                        {previewLoading && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="flex flex-col items-center justify-center py-6 text-white/40 font-semibold text-xs space-y-3"
                                            >
                                                <RefreshCw className="animate-spin w-5 h-5 text-brand-accent1" />
                                                <span>Зареждане на преглед...</span>
                                            </motion.div>
                                        )}
                                        {previewData && !previewLoading && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="w-full mt-6 text-left"
                                            >
                                                <div className="flex items-center justify-between mb-3 px-2">
                                                    <h4 className="text-sm font-bold text-white/90">Преглед на данните</h4>
                                                    <Badge className="bg-white/5 border-white/10 text-white/50 text-[10px] font-bold tracking-widest uppercase">
                                                        {previewData.total_rows.toLocaleString()} Записа
                                                    </Badge>
                                                </div>
                                                <div className="w-full overflow-x-auto rounded-xl border border-white/10 bg-[#0d0f18]/40 custom-scrollbar">
                                                    <table className="w-full text-xs text-left text-white/70 whitespace-nowrap">
                                                        <thead className="text-[10px] font-black uppercase text-white/40 bg-white/5 tracking-wider">
                                                            <tr>
                                                                {previewData.columns.map((col, idx) => (
                                                                    <th key={col + idx} className="px-4 py-3">{FEATURE_LABELS[col] || col.replace(/_/g, ' ')}</th>
                                                                ))}
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-white/5">
                                                            {previewData.preview_data.map((row, i) => (
                                                                <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                                                                    {previewData.columns.map((col, idx) => (
                                                                        <td key={col + idx} className="px-4 py-2 font-medium">{row[col]}</td>
                                                                    ))}
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                                <p className="text-[10px] text-white/30 text-center mt-3 uppercase tracking-widest font-semibold flex items-center justify-center gap-1.5">
                                                    <Info size={12} />
                                                    Показани са първите 5 реда от файла
                                                </p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <p className="text-[10px] text-white/10 uppercase tracking-[0.2em] font-bold mt-4">GDPR Level-3 Security Enabled</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                ) : (
                    <>
                        {/* Header Section */}
                        <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-xl bg-brand-accent1/10 flex items-center justify-center border border-brand-accent1/20">
                                        <BarChart3 className="text-brand-accent1 w-5 h-5" />
                                    </div>
                                    <div>
                                        <h1 className="text-3xl font-black text-white tracking-tighter leading-none">
                                            {dashboardStats.snapshot_name || "Глобален Преглед"}
                                        </h1>
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider px-2 py-0">На Живо</Badge>
                                            <span className="text-white/30 text-xs font-bold uppercase tracking-widest">{dashboardStats.total_employees} Профила</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    localStorage.removeItem('dashboardStats');
                                    setDashboardStats(null);
                                    setFile(null);
                                }}
                                className="h-11 px-5 rounded-xl gap-2 text-white/50 hover:text-white border-white/5 hover:bg-white/5 hover:border-white/20 transition-all font-bold text-sm"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Нов Снапшот
                            </Button>
                        </motion.div>

                        {/* KPI Cards Row */}
                        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card className="bg-gradient-to-br from-brand-accent1/10 to-[#0d0f18] border-brand-accent1/20 shadow-[0_8px_32px_rgba(79,126,247,0.1)] relative overflow-hidden group rounded-[2rem]">
                                <div className="absolute top-0 right-0 p-6 opacity-[0.05] group-hover:scale-110 transition-transform duration-500 pointer-events-none">
                                    <Users size={80} />
                                </div>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-xs font-bold text-brand-accent1 uppercase tracking-widest flex items-center gap-2">
                                        <Users className="h-4 w-4" /> Служители
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-baseline gap-2 mb-1">
                                        <span className="text-3xl font-black text-white tabular-nums tracking-tighter">
                                            {dashboardStats.total_employees}
                                        </span>
                                    </div>
                                    <p className="flex items-center text-[10px] text-white/50 leading-relaxed font-medium mt-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-brand-accent1 shadow-[0_0_8px_rgba(79,126,247,0.5)] mr-2" />
                                        Общ капацитет на организацията
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-red-500/10 to-[#0d0f18] border-red-500/20 shadow-[0_8px_32px_rgba(239,68,68,0.1)] relative overflow-hidden group rounded-[2rem]">
                                <div className="absolute top-0 right-0 p-6 opacity-[0.05] group-hover:scale-110 transition-transform duration-500 pointer-events-none">
                                    <AlertTriangle size={80} />
                                </div>
                                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                                    <CardTitle className="text-xs font-bold text-red-500 uppercase tracking-widest flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4" /> Висок Риск
                                    </CardTitle>
                                    <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20 text-[10px] font-bold tracking-widest uppercase">Критично</Badge>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-baseline gap-2 mb-1">
                                        <span className="text-3xl font-black text-white tabular-nums tracking-tighter">
                                            {dashboardStats.high_risk_count}
                                        </span>
                                    </div>
                                    <p className="flex items-center text-[10px] text-white/50 leading-relaxed font-medium mt-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] mr-2" />
                                        {((dashboardStats.high_risk_count / dashboardStats.total_employees) * 100).toFixed(1)}% от екипа е в риск
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-amber-500/10 to-[#0d0f18] border-amber-500/20 shadow-[0_8px_32px_rgba(245,158,11,0.1)] relative overflow-hidden group rounded-[2rem]">
                                <div className="absolute top-0 right-0 p-6 opacity-[0.05] group-hover:scale-110 transition-transform duration-500 pointer-events-none">
                                    <TrendingDown size={80} />
                                </div>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-xs font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2">
                                        <TrendingDown className="h-4 w-4" /> Среден Риск
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-baseline gap-2 mb-1">
                                        <span className="text-3xl font-black text-white tabular-nums tracking-tighter">
                                            {(dashboardStats.avg_risk * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                    <p className="flex items-center text-[10px] text-white/50 leading-relaxed font-medium mt-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)] mr-2" />
                                        Прогнозно текучество (всички отдели)
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-red-500/10 to-[#0d0f18] border-red-500/20 shadow-[0_8px_32px_rgba(239,68,68,0.1)] relative overflow-hidden group rounded-[2rem]">
                                <div className="absolute top-0 right-0 p-6 opacity-[0.05] group-hover:scale-110 transition-transform duration-500 pointer-events-none">
                                    <DollarSign size={80} />
                                </div>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-xs font-bold text-red-500 uppercase tracking-widest flex items-center gap-2">
                                        <AlertOctagon className="h-4 w-4" /> Финансов Риск
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-baseline gap-2 mb-1">
                                        <span className="text-3xl font-black text-white tabular-nums tracking-tighter">
                                            {((dashboardStats.high_risk_count * dashboardStats.avg_salary * 6) / 1000000).toFixed(1)} млн.
                                        </span>
                                        <span className="text-xs font-bold text-white/40">лв</span>
                                    </div>
                                    <p className="flex items-center text-[10px] text-white/50 leading-relaxed font-medium mt-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] mr-2" />
                                        Потенциална загуба при напускане на всички в риск
                                    </p>
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Main Charts Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            {/* Risk Distribution Chart */}
                            <motion.div variants={itemVariants} className="lg:col-span-8">
                                <Card className="bg-[#0d0f18]/60 backdrop-blur-xl border border-white/5 rounded-[2rem] overflow-hidden group">
                                    <CardHeader className="flex flex-row items-start justify-between p-8 pb-4">
                                        <div className="space-y-1">
                                            <CardTitle className="text-xl font-black text-white tracking-tight">Профил на Риска</CardTitle>
                                            <p className="text-sm text-white/30 font-medium tracking-tight">Разпределение на вероятностния риск в екипа</p>
                                        </div>
                                        <div className="hidden sm:flex gap-3">
                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" /> Стабилни
                                            </div>
                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-500/5 border border-red-500/20 text-[10px] font-bold text-red-500 uppercase tracking-widest">
                                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" /> Критични
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-8 pt-0">
                                        <div className="h-[320px] w-full mt-4">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart
                                                    data={dashboardStats.risk_distribution || []}
                                                    margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
                                                >
                                                    <defs>
                                                        <linearGradient id="colorRisk" x1="0" y1="0" x2="1" y2="0">
                                                            <stop offset="0%" stopColor="#10b981" stopOpacity={0.5} />
                                                            <stop offset="50%" stopColor="#f59e0b" stopOpacity={0.4} />
                                                            <stop offset="100%" stopColor="#ef4444" stopOpacity={0.6} />
                                                        </linearGradient>
                                                        <linearGradient id="strokeRisk" x1="0" y1="0" x2="1" y2="0">
                                                            <stop offset="0%" stopColor="#10b981" />
                                                            <stop offset="50%" stopColor="#f59e0b" />
                                                            <stop offset="100%" stopColor="#ef4444" />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="10 10" stroke="rgba(255,255,255,0.02)" vertical={false} />
                                                    <XAxis
                                                        dataKey="risk"
                                                        stroke="rgba(255,255,255,0.15)"
                                                        fontSize={11}
                                                        fontWeight={600}
                                                        tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                                                        axisLine={false}
                                                        tickLine={false}
                                                        dy={15}
                                                    />
                                                    <YAxis
                                                        stroke="rgba(255,255,255,0.15)"
                                                        fontSize={11}
                                                        fontWeight={600}
                                                        axisLine={false}
                                                        tickLine={false}
                                                    />
                                                    <Tooltip
                                                        cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
                                                        content={({ active, payload }) => {
                                                            if (active && payload && payload.length) {
                                                                const data = payload[0].payload
                                                                return (
                                                                    <div className="bg-[#09090f]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl">
                                                                        <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1">Рисково ниво</p>
                                                                        <div className="flex items-end gap-2">
                                                                            <span className="text-2xl font-black text-white">{(data.risk * 100).toFixed(0)}%</span>
                                                                            <span className="text-brand-accent1 text-sm font-bold mb-1">({data.count} души)</span>
                                                                        </div>
                                                                    </div>
                                                                )
                                                            }
                                                            return null
                                                        }}
                                                    />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="count"
                                                        stroke="url(#strokeRisk)"
                                                        strokeWidth={4}
                                                        fillOpacity={1}
                                                        fill="url(#colorRisk)"
                                                        animationDuration={2000}
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            {/* Side Panel: Key Drivers */}
                            <motion.div variants={itemVariants} className="lg:col-span-4">
                                <Card className="h-full bg-[#0d0f18]/60 backdrop-blur-xl border border-white/5 rounded-[2rem] flex flex-col group relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                                        <BarChart3 size={120} />
                                    </div>
                                    <CardHeader className="p-8 pb-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <CardTitle className="text-xl font-black text-white tracking-tight">Рискови Фактори</CardTitle>
                                            <Badge variant="outline" className="text-[10px] font-bold bg-brand-accent1/5 border-brand-accent1/20 text-brand-accent1 uppercase tracking-widest">AI SHAP</Badge>
                                        </div>
                                        <p className="text-sm text-white/30 font-medium tracking-tight leading-snug">
                                            Факторите с най-голямо значение за цялата организация
                                        </p>
                                    </CardHeader>
                                    <CardContent className="p-8 flex-1 flex flex-col justify-between pt-0 mt-4">
                                        <div className="space-y-6">
                                            {(dashboardStats.top_risk_factors || []).slice(0, 5).map((factor: any, idx: number) => {
                                                const colors = getFactorColors(factor.impact, idx)
                                                const maxImpact = dashboardStats.top_risk_factors?.[0]?.impact || 1
                                                const percent = Math.min(100, (factor.impact / maxImpact) * 100)

                                                return (
                                                    <FactorItem
                                                        key={factor.name}
                                                        label={getFactorLabel(factor.name)}
                                                        impact={factor.impact > 0 ? `+${factor.impact.toFixed(3)}` : factor.impact.toFixed(3)}
                                                        desc={factor.name}
                                                        color={colors.text}
                                                        barColor={colors.bar}
                                                        glow={colors.glow}
                                                        percent={percent}
                                                        delay={idx * 0.1}
                                                    />
                                                )
                                            })}
                                        </div>

                                        <div className="mt-8 pt-6 border-t border-white/5">
                                            <Button
                                                onClick={() => setShowShapDetails(true)}
                                                className="w-full justify-between h-12 rounded-xl text-white/60 hover:text-white bg-white/[0.03] border border-white/5 hover:border-white/20 transition-all font-bold group px-4"
                                            >
                                                Виж детайлен SHAP анализ
                                                <ArrowRight className="h-4 w-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </div>

                        <motion.div variants={itemVariants} className="mt-12 border-t border-white/5 pt-12">
                            <Insights />
                        </motion.div>
                    </>
                )}
            </motion.div>

            {/* SHAP Detail Layer */}
            <AnimatePresence>
                {showShapDetails && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowShapDetails(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60]"
                        />
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", stiffness: 300, damping: 32 }}
                            className="fixed inset-y-0 right-0 w-full max-w-[540px] z-[70] shadow-[0_0_100px_rgba(0,0,0,0.8)]"
                        >
                            <GlobalShapDetails
                                onClose={() => setShowShapDetails(false)}
                                stats={dashboardStats}
                            />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}

const FactorItem = ({ label, impact, desc, color, barColor, glow, percent, delay }: any) => (
    <div className="group cursor-pointer">
        <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-white/70 group-hover:text-white transition-colors tracking-tight">{label}</span>
            <Badge variant="outline" className={cn("font-mono font-black text-[10px] border-none px-0", color)}>
                {impact}
            </Badge>
        </div>
        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden relative">
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percent}%` }}
                transition={{ duration: 1.2, delay: 0.5 + delay, ease: "easeOut" }}
                className={cn("h-full rounded-full transition-all group-hover:brightness-110", barColor)}
                style={{ boxShadow: `0 0 12px ${glow}` }}
            />
        </div>
        <div className="flex items-center justify-between mt-1.5">
            <p className="text-[9px] text-white/15 font-bold uppercase tracking-widest leading-none">{desc}</p>
            <span className="text-[9px] text-white/30 font-bold">{percent.toFixed(0)}%</span>
        </div>
    </div>
)

