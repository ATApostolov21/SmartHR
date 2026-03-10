import { useState, useEffect, useRef } from "react";
import {
    BrainCircuit,
    FlaskConical,
    Sliders,
    Users,
    LayoutDashboard,
    ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface FeatureNode {
    id: number;
    title: string;
    description: string;
    metric: string;
    benefit: string;
    icon: React.ElementType;
}

const features: FeatureNode[] = [
    {
        id: 1,
        title: "Предсказване",
        description: "AI модел оценява риска от напускане индивидуално за всеки служител въз основа на реални данни.",
        metric: "94% AUC",
        benefit: "Действай преди да е станало късно",
        icon: BrainCircuit,
    },
    {
        id: 2,
        title: "SHAP Анализ",
        description: "Вижни кои работни фактори — заплата, часове, обучение — движат риска за конкретен служител.",
        metric: "Топ 5 фактора",
        benefit: "Разбираеми решения, не черна кутия",
        icon: FlaskConical,
    },
    {
        id: 3,
        title: "Симулатор",
        description: "Провери как промяна на заплата, часове или бонус ще промени рисковата оценка — в реално време.",
        metric: "Real-time",
        benefit: "Тествай преди да инвестираш",
        icon: Sliders,
    },
    {
        id: 4,
        title: "Служители",
        description: "Пълна таблица с рискови оценки, спарклайни на заплата спрямо пазара и филтри по отдел.",
        metric: "3 000+ записа",
        benefit: "Приоритизирай вниманието си",
        icon: Users,
    },
    {
        id: 5,
        title: "Прозрения",
        description: "Стратегически анализ — кои отдели са с най-висок риск, топ причини за текучество и тенденции.",
        metric: "6 отдела",
        benefit: "Ситуационна осведоменост на ниво CVO",
        icon: LayoutDashboard,
    },
    {
        id: 6,
        title: "Сигурност",
        description: "Данните не напускат средата ти. Пълен GDPR контрол, ролеви достъп и одит лог.",
        metric: "100% локално",
        benefit: "Без компромиси с поверителността",
        icon: ShieldCheck,
    },
];

export function RadialOrbitalTimeline() {
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [rotationAngle, setRotationAngle] = useState(0);
    const [autoRotate, setAutoRotate] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);
    const animRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (autoRotate) {
            animRef.current = setInterval(() => {
                setRotationAngle((prev) => (prev + 0.25) % 360);
            }, 50);
        } else {
            if (animRef.current) clearInterval(animRef.current);
        }
        return () => {
            if (animRef.current) clearInterval(animRef.current);
        };
    }, [autoRotate]);

    const calculatePosition = (index: number, total: number) => {
        const angle = ((index / total) * 360 + rotationAngle) % 360;
        const radius = 190;
        const radian = (angle * Math.PI) / 180;
        const x = radius * Math.cos(radian);
        const y = radius * Math.sin(radian);
        const zIndex = Math.round(100 + 50 * Math.cos(radian));
        const opacity = Math.max(0.35, Math.min(1, 0.35 + 0.65 * ((1 + Math.sin(radian)) / 2)));
        return { x, y, zIndex, opacity };
    };

    const handleNodeClick = (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (expandedId === id) {
            setExpandedId(null);
            setAutoRotate(true);
        } else {
            setExpandedId(id);
            setAutoRotate(false);
        }
    };

    const handleBgClick = () => {
        setExpandedId(null);
        setAutoRotate(true);
    };

    return (
        <div
            ref={containerRef}
            className="relative w-full flex items-center justify-center"
            style={{ height: 520 }}
            onClick={handleBgClick}
        >
            {/* Center orb */}
            <div className="absolute z-10 w-16 h-16 rounded-full bg-gradient-to-br from-brand-accent2 via-brand-accent1 to-brand-highlight flex items-center justify-center shadow-[0_0_40px_rgba(99,102,241,0.5)]">
                <div className="absolute w-20 h-20 rounded-full border border-brand-accent1/20 animate-ping opacity-60" />
                <div
                    className="absolute w-28 h-28 rounded-full border border-brand-accent2/10 animate-ping opacity-40"
                    style={{ animationDelay: "0.6s" }}
                />
                <div className="w-8 h-8 rounded-full bg-white/80 backdrop-blur-md" />
            </div>

            {/* Orbit ring */}
            <div className="absolute w-[380px] h-[380px] rounded-full border border-white/[0.07]" />

            {/* Nodes */}
            {features.map((feature, index) => {
                const pos = calculatePosition(index, features.length);
                const isExpanded = expandedId === feature.id;
                const Icon = feature.icon;

                return (
                    <div
                        key={feature.id}
                        className="absolute transition-all duration-500 cursor-pointer"
                        style={{
                            transform: `translate(${pos.x}px, ${pos.y}px)`,
                            zIndex: isExpanded ? 300 : pos.zIndex,
                            opacity: isExpanded ? 1 : pos.opacity,
                        }}
                        onClick={(e) => handleNodeClick(feature.id, e)}
                    >
                        {/* Glow halo */}
                        <div
                            className={cn(
                                "absolute rounded-full transition-all duration-300",
                                isExpanded && "animate-pulse"
                            )}
                            style={{
                                width: 48,
                                height: 48,
                                left: -4,
                                top: -4,
                                background: isExpanded
                                    ? "radial-gradient(circle, rgba(79,126,247,0.35) 0%, transparent 70%)"
                                    : "radial-gradient(circle, rgba(79,126,247,0.12) 0%, transparent 70%)",
                            }}
                        />

                        {/* Node button */}
                        <div
                            className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                                isExpanded
                                    ? "bg-brand-accent1 border-brand-accent1 shadow-[0_0_20px_rgba(79,126,247,0.7)] scale-125"
                                    : "bg-brand-surface border-brand-border hover:border-brand-accent1/50 hover:bg-brand-accent1/10"
                            )}
                        >
                            <Icon
                                className={cn(
                                    "w-4 h-4 transition-colors",
                                    isExpanded ? "text-white" : "text-white/60"
                                )}
                            />
                        </div>

                        {/* Node label */}
                        <div
                            className={cn(
                                "absolute top-12 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-semibold tracking-wide transition-all duration-300",
                                isExpanded ? "text-brand-accent1 scale-110" : "text-white/50"
                            )}
                        >
                            {feature.title}
                        </div>

                        {/* Expanded popup */}
                        {isExpanded && (
                            <Card
                                className="absolute top-16 left-1/2 -translate-x-1/2 w-64 bg-[#0d0f18]/95 backdrop-blur-xl border border-brand-accent1/25 shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-visible"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Connector */}
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-px h-3 bg-brand-accent1/50" />
                                <CardHeader className="pb-2 pt-4 px-4">
                                    {/* Metric chip */}
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-accent1/15 border border-brand-accent1/25 text-brand-accent1 text-xs font-bold tracking-wide w-fit mb-2">
                                        {feature.metric}
                                    </div>
                                    <CardTitle className="text-sm text-white font-bold">
                                        {feature.title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-4 pb-4">
                                    <p className="text-xs text-white/65 leading-relaxed mb-3">
                                        {feature.description}
                                    </p>
                                    <p className="text-xs text-brand-accent2 italic font-medium">
                                        → {feature.benefit}
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
