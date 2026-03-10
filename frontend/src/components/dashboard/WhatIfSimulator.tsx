import ReactMarkdown from "react-markdown"
import * as React from "react"
import { RefreshCw, ArrowRight, TrendingDown, TrendingUp, Lightbulb, User, CheckCircle2, LayoutDashboard, BrainCircuit, Target, Sparkles, Scale } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from "../ui-core"
import { api } from "../../services/api"
import { cn } from "../../lib/utils"
import { useAppState } from "../../lib/store"
import type { EmployeeData } from "../../types"

// Bulgarian labels for sliders
const SLIDER_LABELS: Record<string, { label: string; unit: string; desc: string }> = {
    "Monthly_Salary": { label: "Месечна заплата", unit: "лв", desc: "Увеличаване на възнаграждението за по-висока лоялност." },
    "Overtime_Hours": { label: "Извънреден труд", unit: "ч/месец", desc: "Намаляване на стреса и предотвратяване на претоварване." },
    "Remote_Work_Frequency": { label: "Дистанционна работа", unit: "%", desc: "Повече гъвкавост и по-добър баланс между работа и живот." },
    "Training_Hours": { label: "Часове обучение", unit: "ч/год", desc: "Инвестиция в уменията и кариерното развитие." },
    "Sick_Days": { label: "Болнични дни", unit: "дни", desc: "Мониторинг на здравословното състояние и натоварването." },
    "Work_Hours_Per_Week": { label: "Работни часове/седмица", unit: "ч/седм", desc: "Оптимизиране на седмичната натовареност." },
    "Projects_Handled": { label: "Брой проекти", unit: "бр.", desc: "Регулиране на мащаба на задачите." },
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

export const WhatIfSimulator = () => {
    const { selectedEmployee, setActiveTab } = useAppState()
    const [employee, setEmployee] = React.useState<EmployeeData | null>(null)
    const [loading, setLoading] = React.useState(false)
    const [simData, setSimData] = React.useState<EmployeeData | null>(null)
    const [originalData, setOriginalData] = React.useState<EmployeeData | null>(null)
    const [newRisk, setNewRisk] = React.useState<number | null>(null)
    const [riskFactors, setRiskFactors] = React.useState<{ feature: string, impact: number }[]>([])
    const [simulating, setSimulating] = React.useState(false)
    const [aiStrategy, setAiStrategy] = React.useState<string>("")
    const [isAiThinking, setIsAiThinking] = React.useState(false)

    // Load employee data when selectedEmployee changes
    React.useEffect(() => {
        if (!selectedEmployee) {
            setEmployee(null)
            setSimData(null)
            setOriginalData(null)
            setNewRisk(null)
            return
        }

        const fetchEmployee = async () => {
            setLoading(true)
            try {
                const result = await api.getAnalysis(selectedEmployee.id ?? 0)
                setEmployee(result.employee)
                setSimData(result.employee)
                setOriginalData(result.employee)
                setRiskFactors(result.top_factors || [])
                setNewRisk(null)
            } catch (err) {
                console.error("Failed to fetch employee", err)
            } finally {
                setLoading(false)
            }
        }
        fetchEmployee()
    }, [selectedEmployee])

    const handleSimulate = async (dataOverride?: EmployeeData) => {
        const dataToPredict = dataOverride || simData;
        if (!dataToPredict) return

        setSimulating(true)
        try {
            const result = await api.predictSingle(dataToPredict)
            setNewRisk(result.churn_probability)
        } catch (err) {
            console.error("Simulation failed", err)
        } finally {
            setSimulating(false)
        }
    }

    const updateSim = (key: keyof EmployeeData, val: any) => {
        if (simData) {
            setSimData({ ...simData, [key]: val })
        }
    }

    const resetSim = () => {
        if (originalData) {
            setSimData(originalData)
            setNewRisk(null)
            setAiStrategy("")
        }
    }

    // Snappy Risk Calculation (Debounced)
    React.useEffect(() => {
        if (!simData || !selectedEmployee) return

        const timer = setTimeout(() => {
            handleSimulate(simData)
        }, 300)

        return () => clearTimeout(timer)
    }, [simData])

    const fetchAIInsight = async () => {
        if (!selectedEmployee || newRisk === null || !simData) return

        setIsAiThinking(true)
        setAiStrategy("")

        try {
            const changes = Object.keys(SLIDER_LABELS)
                .map(key => ({
                    key,
                    label: SLIDER_LABELS[key].label,
                    from: originalData?.[key as keyof EmployeeData] || 0,
                    to: simData[key as keyof EmployeeData] || 0,
                }))
                .filter(c => Math.abs(Number(c.to) - Number(c.from)) > 0.01)

            if (changes.length === 0) {
                setIsAiThinking(false)
                return
            }

            const response = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'}/ai-insight`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                },
                body: JSON.stringify({
                    employee_id: selectedEmployee.id!,
                    changes,
                    simulated_risk: newRisk
                })
            })

            if (!response.ok) throw new Error('Stream request failed')

            const reader = response.body?.getReader()
            const decoder = new TextDecoder()

            setIsAiThinking(false)

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read()
                    if (done) break
                    const chunk = decoder.decode(value, { stream: true })
                    setAiStrategy(prev => prev + chunk)
                }
            }
        } catch (err) {
            console.error("AI Insight stream failed", err)
            setIsAiThinking(false)
        }
    }

    const applyHeuristic = async () => {
        if (!simData || !riskFactors.length) return;

        const controllableFactors = ["Monthly_Salary", "Overtime_Hours", "Remote_Work_Frequency", "Training_Hours", "Work_Hours_Per_Week", "Projects_Handled", "Sick_Days"];

        let optimized = { ...simData };

        const improve = (key: string, val: number, intensity: 'high' | 'low') => {
            switch (key) {
                case "Monthly_Salary": return Math.min(Math.round(val * (intensity === 'high' ? 1.20 : 1.08)), 15000);
                case "Overtime_Hours": return Math.max(Math.round(val - (intensity === 'high' ? 12 : 5)), 0);
                case "Remote_Work_Frequency": return Math.min(Math.round(val + (intensity === 'high' ? 40 : 15)), 100);
                case "Training_Hours": return Math.min(Math.round(val + (intensity === 'high' ? 20 : 8)), 100);
                case "Work_Hours_Per_Week": return Math.max(Math.round(val - (intensity === 'high' ? 6 : 2)), 35);
                case "Projects_Handled": return Math.max(Math.round(val - (intensity === 'high' ? 2 : 1)), 1);
                case "Sick_Days": return Math.max(Math.round(val - 2), 0);
                default: return val;
            }
        };

        const highRiskControllable = riskFactors
            .filter(f => controllableFactors.includes(f.feature) && f.impact > 0.05)
            .map(f => f.feature);

        controllableFactors.forEach(key => {
            const currentVal = Number(optimized[key as keyof EmployeeData]);

            if (highRiskControllable.includes(key)) {
                (optimized as any)[key] = improve(key, currentVal, 'high');
            } else {
                (optimized as any)[key] = improve(key, currentVal, 'low');
            }
        });

        setSimData(optimized);
        handleSimulate(optimized);
    }

    const getChanges = () => {
        if (!originalData || !simData) return []
        const changes: { key: string; label: string; from: number; to: number; diff: number; positive: boolean }[] = []

        const keys: (keyof EmployeeData)[] = ['Monthly_Salary', 'Overtime_Hours', 'Remote_Work_Frequency', 'Training_Hours', 'Sick_Days', 'Work_Hours_Per_Week', 'Projects_Handled']

        for (const key of keys) {
            const from = Number(originalData[key]) || 0
            const to = Number(simData[key]) || 0
            if (Math.abs(from - to) > 0.01) {
                const info = SLIDER_LABELS[key] || { label: key, unit: '', desc: '' }
                let positive = false
                if (key === 'Monthly_Salary' && to > from) positive = true
                if (key === 'Overtime_Hours' && to < from) positive = true
                if (key === 'Remote_Work_Frequency' && to > from) positive = true
                if (key === 'Training_Hours' && to > from) positive = true
                if (key === 'Sick_Days' && to < from) positive = true
                if (key === 'Work_Hours_Per_Week' && to < from) positive = true
                if (key === 'Projects_Handled' && to < from) positive = true

                changes.push({ key, label: info.label, from, to, diff: to - from, positive })
            }
        }
        return changes
    }

    const changes = getChanges()
    const currentRisk = employee?.churn_probability || 0
    const simulatedRisk = newRisk !== null ? newRisk : currentRisk
    const riskDiff = (simulatedRisk - currentRisk) * 100
    const isBetter = riskDiff < 0

    if (!selectedEmployee) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-160px)] py-12">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative max-w-xl w-full"
                >
                    <div className="relative p-12 bg-[#0d0f18]/60 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 shadow-[0_32px_128px_-16px_rgba(0,0,0,0.6)] flex flex-col items-center text-center space-y-8 overflow-hidden group">
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-accent1/30 to-transparent" />

                        <div className="h-24 w-24 rounded-3xl bg-brand-accent1/10 flex items-center justify-center border border-brand-accent1/20 group-hover:scale-110 group-hover:bg-brand-accent1/15 transition-all duration-700 shadow-[0_0_40px_rgba(79,126,247,0.1)]">
                            <User className="h-12 w-12 text-brand-accent1" />
                        </div>

                        <div className="space-y-3">
                            <h2 className="text-4xl font-black text-white tracking-tighter leading-tight">
                                Изберете <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent1 to-brand-accent2">Служител</span>
                            </h2>
                            <p className="text-white/40 text-base max-w-sm mx-auto font-medium leading-relaxed">
                                Стартирайте What-If симулация, като изберете профил от базата данни.
                            </p>
                        </div>

                        <div className="w-full pt-4 space-y-5">
                            <Button
                                onClick={() => setActiveTab('workforce')}
                                className="w-full bg-gradient-to-r from-brand-accent1 to-brand-accent3 hover:brightness-110 text-white h-14 rounded-2xl shadow-[0_8px_32px_rgba(79,126,247,0.25)] font-black text-base transition-all active:scale-[0.98] disabled:opacity-50 flex gap-2"
                            >
                                <LayoutDashboard size={18} />
                                Към Служители
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
                <RefreshCw className="h-10 w-10 text-brand-accent1 animate-spin" />
                <p className="text-white/40 font-bold uppercase tracking-widest text-xs">Анализиране на параметри...</p>
            </div>
        )
    }

    if (!employee || !simData) {
        return <div className="text-white/50">Грешка при зареждане на данните.</div>
    }

    return (
        <div className="h-full overflow-y-auto pr-2 custom-scrollbar">
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-8 pb-12"
            >
                {/* Premium Header */}
                <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-brand-accent1/10 flex items-center justify-center border border-brand-accent1/20 shadow-[0_0_40px_rgba(79,126,247,0.1)]">
                            <BrainCircuit className="text-brand-accent1 w-8 h-8" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h1 className="text-3xl font-black text-white tracking-tighter">What-If Симулатор</h1>
                                <Badge className="bg-brand-accent1/10 text-brand-accent1 border-brand-accent1/20 text-[10px] font-bold uppercase tracking-widest px-2 py-0">AI Core v2</Badge>
                            </div>
                            <p className="text-white/40 text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                                <User size={12} className="text-brand-accent1" />
                                {employee.Department} • {employee.Job_Title}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={resetSim}
                            className="h-12 px-6 rounded-xl border-white/5 bg-white/5 hover:bg-white/10 text-white font-bold transition-all"
                        >
                            <RefreshCw className="mr-2 h-4 w-4" /> Нулиране
                        </Button>
                        <Button
                            onClick={applyHeuristic}
                            className="h-12 px-6 rounded-xl bg-gradient-to-r from-brand-accent1 to-brand-accent2 text-white font-black shadow-lg shadow-brand-accent1/20 active:scale-95 transition-all"
                        >
                            <Sparkles className="mr-2 h-4 w-4" /> Интелигентна Оптимизация
                        </Button>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Controls Panel */}
                    <motion.div variants={itemVariants} className="lg:col-span-8">
                        <Card className="bg-brand-dark/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] overflow-hidden">
                            <CardHeader className="p-8 pb-0">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="text-xl font-black text-white tracking-tight">Параметри на работната среда</CardTitle>
                                        <p className="text-sm text-white/30 font-medium">Коригирайте стойностите за да симулирате различни сценарии</p>
                                    </div>
                                    <Target className="text-brand-accent1/20 w-12 h-12" />
                                </div>
                            </CardHeader>
                            <CardContent className="p-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                                    <SimSlider
                                        label="Месечна заплата"
                                        value={simData.Monthly_Salary}
                                        min={2000} max={15000} step={100}
                                        unit="лв"
                                        icon={<Scale size={14} className="text-brand-accent1" />}
                                        onChange={(v: number) => updateSim("Monthly_Salary", v)}
                                    />
                                    <SimSlider
                                        label="Извънреден труд"
                                        value={simData.Overtime_Hours}
                                        min={0} max={60} step={1}
                                        unit="ч/мес"
                                        onChange={(v: number) => updateSim("Overtime_Hours", v)}
                                    />
                                    <SimSlider
                                        label="Дистанционна работа"
                                        value={simData.Remote_Work_Frequency}
                                        min={0} max={100} step={10}
                                        unit="%"
                                        onChange={(v: number) => updateSim("Remote_Work_Frequency", v)}
                                    />
                                    <SimSlider
                                        label="Часове обучение"
                                        value={simData.Training_Hours}
                                        min={0} max={100} step={4}
                                        unit="ч/год"
                                        onChange={(v: number) => updateSim("Training_Hours", v)}
                                    />
                                    <SimSlider
                                        label="Болнични дни"
                                        value={simData.Sick_Days}
                                        min={0} max={30} step={1}
                                        unit="дни"
                                        onChange={(v: number) => updateSim("Sick_Days", v)}
                                    />
                                    <SimSlider
                                        label="Работни часове/седмица"
                                        value={simData.Work_Hours_Per_Week}
                                        min={20} max={80} step={2}
                                        unit="ч/седм"
                                        onChange={(v: number) => updateSim("Work_Hours_Per_Week", v)}
                                    />
                                    <SimSlider
                                        label="Брой проекти"
                                        value={simData.Projects_Handled}
                                        min={1} max={20} step={1}
                                        unit="бр."
                                        onChange={(v: number) => updateSim("Projects_Handled", v)}
                                    />
                                </div>
                                <div className="mt-12 pt-8 border-t border-white/5 flex justify-end">
                                    <Button
                                        onClick={() => handleSimulate()}
                                        disabled={simulating}
                                        className="h-14 px-10 rounded-2xl bg-white text-brand-dark hover:bg-white/90 font-black text-base shadow-xl active:scale-95 transition-all flex gap-3"
                                    >
                                        {simulating ? (
                                            <RefreshCw className="h-5 w-5 animate-spin" />
                                        ) : (
                                            <Sparkles className="h-5 w-5 fill-brand-dark" />
                                        )}
                                        {simulating ? "Изчисляване..." : "Калкулирай Риска"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Result Panel */}
                    <motion.div variants={itemVariants} className="lg:col-span-4 flex flex-col gap-6">
                        <Card className="flex-1 bg-brand-dark/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col items-center justify-center p-8 text-center relative group">
                            <div className="absolute inset-0 bg-gradient-to-b from-brand-accent1/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="relative z-10 space-y-6">
                                <p className="text-[10px] font-black text-brand-accent1 uppercase tracking-[0.3em]">Предсказан Резултат</p>

                                <div className="relative inline-block">
                                    <svg className="w-48 h-48 transform -rotate-90">
                                        <circle
                                            cx="96" cy="96" r="80"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="8"
                                            className="text-white/5"
                                        />
                                        <motion.circle
                                            cx="96" cy="96" r="80"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="12"
                                            strokeLinecap="round"
                                            strokeDasharray={502.4}
                                            initial={{ strokeDashoffset: 502.4 }}
                                            animate={{ strokeDashoffset: 502.4 - (502.4 * simulatedRisk) }}
                                            transition={{ duration: 1.5, ease: "easeOut" }}
                                            className={cn(
                                                "transition-colors duration-500",
                                                simulatedRisk >= 0.65 ? "text-red-500" :
                                                    simulatedRisk >= 0.35 ? "text-amber-500" :
                                                        "text-emerald-500"
                                            )}
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <motion.span
                                            key={simulatedRisk}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="text-5xl font-black text-white tracking-tighter"
                                        >
                                            {(simulatedRisk * 100).toFixed(1)}%
                                        </motion.span>
                                        <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-1">Риск от напускане</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-center gap-6">
                                        <div className="text-center">
                                            <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest mb-1">Текущ</p>
                                            <p className="text-lg font-bold text-white/50">{(currentRisk * 100).toFixed(1)}%</p>
                                        </div>
                                        <ArrowRight className="h-5 w-5 text-white/10" />
                                        <div className="text-center">
                                            <p className="text-[10px] text-brand-accent1 font-black uppercase tracking-widest mb-1">Нов</p>
                                            <p className="text-lg font-black text-white">{(simulatedRisk * 100).toFixed(1)}%</p>
                                        </div>
                                    </div>

                                    {newRisk !== null && (
                                        <motion.div
                                            initial={{ scale: 0.9, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className={cn(
                                                "px-4 py-2 rounded-2xl border text-xs font-black uppercase tracking-wider inline-flex items-center gap-2",
                                                isBetter ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"
                                            )}
                                        >
                                            {isBetter ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                                            {Math.abs(riskDiff).toFixed(1)}% {isBetter ? "Намаление на риска" : "Увеличение на риска"}
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                </div>

                {/* Summary Section Overhaul */}
                <AnimatePresence>
                    {changes.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="space-y-6"
                        >
                            <div className="flex items-center gap-4">
                                <div className="h-px flex-1 bg-white/5" />
                                <h3 className="text-sm font-black text-white/30 uppercase tracking-[0.4em] px-4 whitespace-nowrap">Анализ на симулацията</h3>
                                <div className="h-px flex-1 bg-white/5" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {changes.map((change, idx) => (
                                    <motion.div
                                        key={change.key}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className={cn(
                                            "relative p-6 rounded-[2rem] border overflow-hidden group transition-all duration-500",
                                            change.positive ? "bg-emerald-500/[0.03] border-emerald-500/20 hover:border-emerald-500/40" : "bg-orange-500/[0.03] border-orange-500/20 hover:border-orange-500/40"
                                        )}
                                    >
                                        <div className="absolute top-0 right-0 p-4 opacity-[0.05] group-hover:scale-125 transition-transform duration-700 pointer-events-none">
                                            {change.positive ? <CheckCircle2 size={48} className="text-emerald-500" /> : <TrendingUp size={48} className="text-orange-500" />}
                                        </div>

                                        <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-4">{change.label}</p>

                                        <div className="flex items-end gap-3 mb-4">
                                            <span className="text-2xl font-black text-white leading-none">
                                                {Math.round(change.to)}
                                            </span>
                                            <span className={cn(
                                                "text-xs font-bold flex items-center gap-0.5 mb-1",
                                                change.positive ? "text-emerald-400" : "text-orange-400"
                                            )}>
                                                {change.diff > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                                {Math.abs(Math.round(change.diff))}
                                            </span>
                                        </div>

                                        <p className="text-[11px] text-white/40 font-medium leading-relaxed italic">
                                            "{SLIDER_LABELS[change.key]?.desc || ''}"
                                        </p>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Strategic Insights Card */}
                            <Card className={cn(
                                "relative border rounded-[2.5rem] p-10 overflow-hidden transition-all duration-700",
                                simulatedRisk < 0.35 ? "bg-emerald-500/[0.02] border-emerald-500/10" :
                                    simulatedRisk < 0.65 ? "bg-amber-500/[0.02] border-amber-500/10" :
                                        "bg-red-500/[0.02] border-red-500/10"
                            )}>
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                                <div className="flex flex-col md:flex-row items-start gap-8 relative z-10">
                                    <div className={cn(
                                        "w-20 h-20 rounded-[2rem] flex items-center justify-center border-2 shrink-0 shadow-lg transition-transform hover:scale-110",
                                        simulatedRisk < 0.35 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500 shadow-emerald-500/10" :
                                            simulatedRisk < 0.65 ? "bg-amber-500/10 border-amber-500/20 text-amber-500 shadow-amber-500/10" :
                                                "bg-red-500/10 border-red-500/20 text-red-500 shadow-red-500/10"
                                    )}>
                                        {simulatedRisk < 0.35 ? <Sparkles size={36} /> : simulatedRisk < 0.65 ? <Lightbulb size={36} /> : <TrendingUp size={36} />}
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <h4 className={cn(
                                                "text-2xl font-black tracking-tight mb-2",
                                                simulatedRisk < 0.35 ? "text-emerald-400" :
                                                    simulatedRisk < 0.65 ? "text-amber-400" : "text-red-400"
                                            )}>
                                                {simulatedRisk < 0.35 ? "Висока Ефективност на Стратегията" :
                                                    simulatedRisk < 0.65 ? "Умерен Баланс / Изисква Внимание" :
                                                        "Критично Високо Текучество"}
                                            </h4>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="text-[10px] font-black uppercase border-white/10 text-white/30">AI Strategy Insight</Badge>
                                                <div className="w-1 h-1 rounded-full bg-white/20" />
                                                <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">{isBetter ? "Положителна Тенденция" : "Негативна Траектория"}</span>
                                            </div>
                                        </div>

                                        <div className="min-h-[120px] flex flex-col justify-center">
                                            {isAiThinking ? (
                                                <div className="space-y-3 py-2">
                                                    <div className="h-4 bg-white/5 rounded-full w-full animate-pulse" />
                                                    <div className="h-4 bg-white/5 rounded-full w-5/6 animate-pulse" />
                                                    <div className="h-4 bg-white/5 rounded-full w-4/6 animate-pulse" />
                                                </div>
                                            ) : !aiStrategy ? (
                                                <div className="flex flex-col items-center justify-center py-6 space-y-4">
                                                    <p className="text-white/30 text-sm font-medium">Калкулирайте промените и генерирайте стратегия</p>
                                                    <Button
                                                        onClick={fetchAIInsight}
                                                        disabled={changes.length === 0}
                                                        className="bg-brand-accent1 hover:bg-brand-accent2 text-white px-8 py-3 rounded-xl font-black flex gap-2 transition-all active:scale-95 shadow-lg shadow-brand-accent1/20"
                                                    >
                                                        <Sparkles size={16} />
                                                        Генерирай AI Анализ
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="prose prose-invert max-w-none">
                                                    <ReactMarkdown
                                                        components={{
                                                            p: ({ children }: any) => <p className="text-lg text-white/80 leading-relaxed font-medium mb-4">{children}</p>,
                                                            h3: ({ children }: any) => <h3 className="text-xl font-black text-brand-accent1 mt-6 mb-3 uppercase tracking-tighter">{children}</h3>,
                                                            li: ({ children }: any) => <li className="text-white/70 mb-2 list-decimal ml-4 pl-2 border-l border-white/10">{children}</li>,
                                                            ul: ({ children }: any) => <ul className="mb-6 space-y-2">{children}</ul>,
                                                            ol: ({ children }: any) => <ol className="mb-6 space-y-2">{children}</ol>,
                                                            strong: ({ children }: any) => <strong className="text-white font-black">{children}</strong>,
                                                        }}
                                                    >
                                                        {aiStrategy}
                                                    </ReactMarkdown>
                                                    <div className="mt-6 flex justify-end">
                                                        <Button
                                                            onClick={fetchAIInsight}
                                                            variant="ghost"
                                                            className="text-white/30 hover:text-white hover:bg-white/5 text-[10px] font-black uppercase tracking-widest gap-2"
                                                        >
                                                            <RefreshCw size={12} /> Преизчисли Стратегията
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="p-5 rounded-[1.5rem] bg-white/5 border border-white/5 flex flex-col gap-3 group/stat transition-all hover:bg-white/[0.08]">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Финансов Ефект (ROI)</p>
                                                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover/stat:scale-110 transition-transform">
                                                        <Target size={14} />
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-white font-black text-lg leading-tight mb-1">
                                                        {isBetter
                                                            ? `~${(Math.abs(riskDiff) * 1.2).toFixed(0)}% спестени разходи`
                                                            : "0% икономия"}
                                                    </p>
                                                    <p className="text-[10px] text-white/30 font-medium">Прогнозирано намаляване на преките разходи за рекрутиране и обучение на нов кадър.</p>
                                                </div>
                                            </div>

                                            <div className="p-5 rounded-[1.5rem] bg-white/5 border border-white/5 flex flex-col gap-3 group/stat transition-all hover:bg-white/[0.08]">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Прогнозна Ангажираност</p>
                                                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover/stat:scale-110 transition-transform">
                                                        <Sparkles size={14} />
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-white font-black text-lg leading-tight mb-1">
                                                        {isBetter
                                                            ? `+${(Math.abs(riskDiff) * 0.08).toFixed(1)} пункта ръст`
                                                            : "Няма промяна"}
                                                    </p>
                                                    <p className="text-[10px] text-white/30 font-medium">Очакван ръст в мотивацията и субективното усещане за подкрепа от организацията.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    )
}



const SimSlider = ({ label, value, min, max, step, unit, icon, onChange }: any) => (
    <div className="space-y-5 group/slider">
        <div className="flex justify-between items-end">
            <div className="flex items-center gap-2">
                {icon}
                <span className="text-[11px] font-black text-white/30 uppercase tracking-widest leading-none mb-0.5">{label}</span>
            </div>
            <div className="text-right">
                <span className="text-xl font-black text-white tabular-nums leading-none tracking-tighter">{value}</span>
                <span className="text-[10px] font-bold text-white/20 ml-1 uppercase leading-none">{unit}</span>
            </div>
        </div>
        <div className="relative pt-1">
            <input
                type="range"
                min={min} max={max} step={step}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full accent-brand-accent1 h-1 bg-white/5 rounded-full appearance-none cursor-pointer hover:accent-brand-accent2 transition-all transition-colors appearance-none overflow-hidden [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(255,255,255,0.5)] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-brand-accent1"
            />
        </div>
    </div>
)

