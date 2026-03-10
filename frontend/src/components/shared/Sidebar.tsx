import { motion } from 'framer-motion';
import {
    LayoutDashboard, Users, Sliders,
    LogOut, BarChart3, Cpu, Settings, ShieldCheck, Building2, History
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAppState } from '../../lib/store';
import { useAuth } from '../../lib/auth';

const ROLE_NAV: Record<string, { id: string; label: string; icon: any }[]> = {
    system_admin: [
        { id: 'model_analysis', label: 'Анализ на Модела', icon: BarChart3 },
        { id: 'model_optimization', label: 'Оптимизация', icon: Cpu },
        { id: 'users', label: 'Потребители', icon: ShieldCheck },
        { id: 'settings', label: 'Настройки', icon: Settings },
    ],
    hr_manager: [
        { id: 'overview', label: 'Преглед', icon: LayoutDashboard },
        { id: 'workforce', label: 'Служители', icon: Users },
        { id: 'simulator', label: 'Симулатор', icon: Sliders },
        { id: 'analysis_history', label: 'История на Анализите', icon: History },
    ],
    department_head: [
        { id: 'dept_overview', label: 'Преглед на Отдела', icon: Building2 },
        { id: 'workforce', label: 'Моят Отдел', icon: Users },
        { id: 'simulator', label: 'Симулатор', icon: Sliders },
    ],
};

export const Sidebar = () => {
    const { currentWorkspace, activeTab, setActiveTab, setSelectedEmployee } = useAppState();
    const { role, logout } = useAuth();

    const navItems = ROLE_NAV[role ?? ''] ?? ROLE_NAV['hr_manager'];

    return (
        <motion.aside
            className="h-screen w-[280px] bg-[#0d0f18]/80 backdrop-blur-[24px] border-r border-white/5 flex flex-col font-sans relative z-20"
            initial={false}
        >
            {/* Top accent line (subtle) */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-accent1/20 to-transparent" />

            {/* Workspace Title */}
            <div className="p-6 relative z-20">
                <div className="flex items-center gap-3">
                    <div className="relative flex items-center justify-center">
                        <div className="absolute inset-0 bg-brand-accent1/10 blur-xl rounded-full" />
                        <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 flex items-center justify-center shadow-lg group-hover:bg-white/[0.1] transition-colors">
                            <Building2 size={18} className="text-white/80" />
                        </div>
                    </div>
                    <div className="flex flex-col flex-1 truncate">
                        <h2 className="text-sm font-bold text-white tracking-tight leading-tight truncate">
                            {currentWorkspace}
                        </h2>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-4 space-y-1">
                <div className="px-4 mb-3 text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">
                    {role === 'system_admin' ? 'Администрация' : 'Анализи'}
                </div>
                {navItems.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => {
                                setActiveTab(item.id);
                                setSelectedEmployee(null);
                            }}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 group relative overflow-hidden",
                                isActive
                                    ? "text-white bg-white/[0.06] border border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
                                    : "text-white/40 hover:text-white/90 hover:bg-white/[0.03] border border-transparent hover:border-white/[0.05]"
                            )}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeTabSelection"
                                    className="absolute left-0 w-1 h-1/2 bg-gradient-to-b from-brand-accent1 to-brand-accent2 rounded-r-full"
                                />
                            )}
                            <item.icon
                                size={18}
                                className={cn(
                                    "transition-all duration-300",
                                    isActive ? "text-brand-accent1 scale-110 drop-shadow-[0_0_8px_rgba(79,126,247,0.5)]" : "text-white/30 group-hover:text-white/60"
                                )}
                            />
                            {item.label}
                        </button>
                    );
                })}
            </nav>

            {/* User Profile */}
            <div className="p-6 border-t border-white/[0.05] bg-white/[0.01]">
                <div className="flex items-center gap-3 px-2 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 flex items-center justify-center text-xs font-bold text-white uppercase shadow-inner relative overflow-hidden group">
                        <div className="absolute inset-0 bg-brand-accent1/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <Users size={16} className="opacity-70 relative z-10" />
                    </div>
                    <div className="text-left flex-1">
                        <h3 className="text-sm font-bold text-white/90 capitalize tracking-tight">{role ? role.replace(/_/g, ' ') : 'Session'}</h3>
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            <p className="text-[10px] text-emerald-400/80 font-bold uppercase tracking-wider">Online</p>
                        </div>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white/60 hover:text-white hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 transition-all duration-300 group font-bold text-xs"
                >
                    <span>Изход</span>
                    <LogOut size={14} className="opacity-40 group-hover:opacity-100 transition-opacity" />
                </button>
            </div>
        </motion.aside>
    );
};
