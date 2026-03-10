import { cn } from '../../lib/utils';
import { AlertTriangle, TrendingUp, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface RiskBadgeProps {
    probability: number;
}

export const RiskBadge = ({ probability }: RiskBadgeProps) => {
    let colorClass = "";
    let icon = null;
    let label = "";
    let glowClass = "";

    if (probability > 0.7) {
        colorClass = "bg-red-500/10 text-red-400 border-red-500/20";
        icon = <AlertTriangle size={12} className="relative z-10" />;
        label = "Висок Риск";
        glowClass = "bg-red-500/20";
    } else if (probability > 0.4) {
        colorClass = "bg-amber-500/10 text-amber-400 border-amber-500/20";
        icon = <TrendingUp size={12} className="relative z-10" />;
        label = "Среден Риск";
        glowClass = "bg-amber-500/10";
    } else {
        colorClass = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
        icon = <CheckCircle size={12} className="relative z-10" />;
        label = "Нисък Риск";
        glowClass = "bg-emerald-500/10";
    }

    return (
        <span className={cn(
            "relative inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border backdrop-blur-md transition-all group overflow-hidden",
            colorClass
        )}>
            {/* Background Glow */}
            <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity blur-md", glowClass)} />

            {probability > 0.7 && (
                <motion.span
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute left-2 w-1.5 h-1.5 rounded-full bg-red-500"
                />
            )}

            <span className={cn(probability > 0.7 ? "ml-2.5" : "", "flex items-center gap-1.5 relative z-10")}>
                {icon}
                {label}
            </span>
            <span className="ml-1 opacity-60 font-mono font-bold relative z-10">{(probability * 100).toFixed(0)}%</span>
        </span>
    );
};
