import React, { useEffect, useMemo, useState } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    flexRender,
    createColumnHelper,
    type SortingState,
    type ColumnFiltersState
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../services/api';
import { useAppState } from '../../lib/store';
import { Search, ArrowUpDown, Filter, User, ChevronRight, Download } from 'lucide-react';
import { cn } from '../../lib/utils';
import { RiskBadge } from './RiskBadge';
import { Sparkline } from './Sparkline';
import { Button } from '../ui-core';

// Extended type based on our API update
interface Employee {
    id: number;
    department: string;
    job_title: string;
    years_at_company: number;
    churn_probability: number;
    monthly_salary?: number;
    performance_score?: number;
    age?: number;
    gender?: string;
    education_level?: string;
}

const columnHelper = createColumnHelper<Employee>();

export const WorkforceTable = () => {
    const { setSelectedEmployee, dashboardStats } = useAppState();
    const [data, setData] = useState<Employee[]>([]);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showExportTooltip, setShowExportTooltip] = useState(false);

    const handleExport = () => {
        // Prepare CSV data from the visible rows
        const headers = ['ID', 'Job Title', 'Department', 'Monthly Salary', 'Performance Score', 'Risk Probability'];
        const csvRows = rows.map(row => {
            const d = row.original;
            return [
                d.id,
                `"${d.job_title}"`,
                `"${d.department}"`,
                d.monthly_salary || 0,
                d.performance_score || 0,
                `${(d.churn_probability * 100).toFixed(1)}%`
            ].join(',');
        });

        const csvContent = [headers.join(','), ...csvRows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `hr_analytics_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const parentRef = React.useRef<HTMLDivElement>(null);

    // Derive unique departments for filter
    const departments = useMemo(() => {
        const depts = new Set(data.map(d => d.department));
        return ['All', ...Array.from(depts)];
    }, [data]);

    // Fetch data
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const result = await api.getEmployees();
                setData(result);
            } catch (err) {
                console.error("Failed to load employees", err);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [dashboardStats]);

    const columns = useMemo(() => [
        columnHelper.accessor('id', {
            header: '#',
            cell: info => <span className="text-white/20 font-mono text-[10px] font-bold">{info.getValue()}</span>,
            size: 50,
        }),
        columnHelper.accessor('job_title', {
            header: 'Служител / Позиция', // Employee / Position
            cell: info => (
                <div className="flex items-center gap-3 min-w-[200px] overflow-hidden group/cell">
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group-hover/cell:bg-brand-accent1/10 group-hover/cell:border-brand-accent1/20 transition-colors">
                        <User size={14} className="text-white/40 group-hover/cell:text-brand-accent1 transition-colors" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-white/90 truncate tracking-tight">Employee #{info.row.original.id}</span>
                        <span className="text-[10px] text-white/40 truncate uppercase font-bold tracking-wider">{info.getValue()}</span>
                    </div>
                </div>
            ),
            size: 250,
        }),
        columnHelper.accessor('department', {
            header: 'Отдел', // Department
            cell: info => (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-white/5 text-white/60 border border-white/10 backdrop-blur-sm">
                    {info.getValue()}
                </span>
            ),
        }),
        columnHelper.accessor('monthly_salary', {
            header: 'Заплата / Пазар', // Salary vs Market
            cell: info => {
                const salary = info.getValue() || 0;
                const isHigh = salary > 6000;
                return (
                    <div className="flex items-center gap-4 w-full group/salary">
                        <span className="text-white/80 font-mono text-sm w-20 text-right font-bold tracking-tight">
                            {salary.toLocaleString('bg-BG')} <span className="text-[10px] text-white/30 truncate uppercase font-bold tracking-wider">лв.</span>
                        </span>
                        <div className="flex-1 max-w-[80px]">
                            <Sparkline
                                data={[salary * 0.9, salary, salary * 1.05, salary * 0.98, salary]}
                                color={isHigh ? "#4f7ef7" : "#fbbf24"}
                            />
                        </div>
                    </div>
                )
            },
            size: 200,
        }),
        columnHelper.accessor('performance_score', {
            header: 'KPI / Оценка', // Performance
            cell: info => {
                const score = info.getValue() || 0;
                const percent = (score / 5) * 100;
                return (
                    <div className="flex items-center gap-3">
                        <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${percent}%` }}
                                transition={{ duration: 1 }}
                                className={cn(
                                    "h-full rounded-full",
                                    score >= 4 ? "bg-gradient-to-r from-emerald-500 to-teal-400" :
                                        score >= 3 ? "bg-gradient-to-r from-brand-accent1 to-brand-accent2" :
                                            "bg-gradient-to-r from-red-500 to-orange-400"
                                )}
                            />
                        </div>
                        <span className="text-[10px] font-mono font-bold text-white/40">{score.toFixed(1)}</span>
                    </div>
                )
            }
        }),
        columnHelper.accessor('churn_probability', {
            header: 'Прогнозен Риск', // Churn Risk
            cell: info => <RiskBadge probability={info.getValue()} />,
        }),
    ], []);

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            globalFilter,
            columnFilters,
        },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        globalFilterFn: (row, columnId, filterValue) => {
            const value = row.getValue(columnId);
            if (value === null || value === undefined) return false;
            return String(value)
                .toLowerCase()
                .includes(String(filterValue).toLowerCase());
        },
    });

    const { rows } = table.getRowModel();

    // Virtualization
    const virtualizer = useVirtualizer({
        count: rows.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 72, // Row height
        overscan: 10,
    });

    return (
        <div className="h-full flex flex-col space-y-6">
            {/* Header / Filter Bar */}
            <div className="flex items-center justify-between gap-4 px-1">
                <div className="flex items-center gap-4 flex-1">
                    <div className="relative group max-w-sm w-full">
                        <div className="absolute inset-0 bg-brand-accent1/10 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 w-4 h-4 group-focus-within:text-brand-accent1 transition-colors z-10" />
                        <input
                            value={globalFilter ?? ''}
                            onChange={e => setGlobalFilter(e.target.value)}
                            placeholder="Търсене на служители..."
                            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-brand-accent1/30 transition-all font-medium backdrop-blur-xl relative z-0"
                        />
                    </div>

                    <div className="relative">
                        <button
                            onClick={() => setShowFilterMenu(!showFilterMenu)}
                            className={cn(
                                "flex items-center gap-2.5 px-5 py-3.5 rounded-2xl border transition-all text-sm font-bold tracking-tight backdrop-blur-md",
                                columnFilters.length > 0
                                    ? "bg-brand-accent1/10 border-brand-accent1/30 text-brand-accent1"
                                    : "bg-white/[0.03] border-white/5 text-white/60 hover:text-white hover:border-white/10"
                            )}
                        >
                            <Filter className="w-4 h-4" />
                            <span>{columnFilters.length > 0 ? "Активни" : "Филтри"}</span>
                        </button>

                        <AnimatePresence>
                            {showFilterMenu && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowFilterMenu(false)} />
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95, filter: "blur(4px)" }}
                                        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                                        exit={{ opacity: 0, y: 8, scale: 0.98, filter: "blur(4px)" }}
                                        transition={{
                                            type: "spring",
                                            stiffness: 400,
                                            damping: 30,
                                            mass: 0.8
                                        }}
                                        className="absolute top-full left-0 mt-3 w-64 bg-[#0d0f18]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_32px_64px_rgba(0,0,0,0.5)] p-5 z-50 overflow-hidden outline-none"
                                    >
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent1/10 blur-[50px] rounded-full -mr-16 -mt-16" />
                                        <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-4 relative z-10">Отдели</h4>
                                        <div className="space-y-1.5 relative z-10">
                                            {departments.map(dept => {
                                                const isActive = dept === 'All'
                                                    ? columnFilters.length === 0
                                                    : columnFilters.some(f => f.id === 'department' && f.value === dept);

                                                return (
                                                    <button
                                                        key={dept}
                                                        onClick={() => {
                                                            if (dept === 'All') {
                                                                setColumnFilters([]);
                                                            } else {
                                                                setColumnFilters([{ id: 'department', value: dept }]);
                                                            }
                                                            setShowFilterMenu(false);
                                                        }}
                                                        className={cn(
                                                            "w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all",
                                                            isActive ? "bg-brand-accent1/10 text-brand-accent1 shadow-[inset_0_0_20px_rgba(79,126,247,0.1)]" : "text-white/40 hover:bg-white/5 hover:text-white"
                                                        )}
                                                    >
                                                        {dept === 'All' ? 'Всички Отдели' : dept}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <div className="relative">
                    <Button
                        variant="outline"
                        onMouseEnter={() => setShowExportTooltip(true)}
                        onMouseLeave={() => setShowExportTooltip(false)}
                        onClick={handleExport}
                        className="h-12 px-6 rounded-2xl border-white/5 bg-white/[0.03] text-white/60 hover:text-white flex gap-2 font-bold tracking-tight relative group overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-white/[0.05] translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                        <Download size={16} className="relative z-10" />
                        <span className="relative z-10">Експорт</span>
                    </Button>

                    <AnimatePresence>
                        {showExportTooltip && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                className="absolute top-1/2 right-[calc(100%+16px)] -translate-y-1/2 px-4 py-2 bg-brand-accent1 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-xl z-50 whitespace-nowrap pointer-events-none"
                            >
                                <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 bg-brand-accent1 rotate-45" />
                                Свали данните като CSV файл
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Table Structure */}
            <div className="flex-1 flex flex-col min-h-0 rounded-[2rem] border border-white/5 bg-white/[0.02] backdrop-blur-xl overflow-hidden shadow-[0_24px_48px_rgba(0,0,0,0.4)]">
                {/* Fixed Header */}
                <div className="grid bg-white/[0.03] border-b border-white/5 text-[10px] font-black text-white/30 uppercase tracking-[0.2em] pr-4">
                    {table.getHeaderGroups().map(headerGroup => (
                        <div key={headerGroup.id} className="flex px-6 py-5">
                            {headerGroup.headers.map(header => (
                                <div
                                    key={header.id}
                                    className="flex-1 flex items-center gap-2 cursor-pointer hover:text-white transition-colors"
                                    onClick={header.column.getToggleSortingHandler()}
                                    style={{ width: header.column.getSize(), flexGrow: header.column.getSize() === 50 ? 0 : 1 }}
                                >
                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                    {header.column.getIsSorted() && <ArrowUpDown className="w-3 h-3 text-brand-accent1" />}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>

                {/* Scrollable Body */}
                <div
                    ref={parentRef}
                    className="flex-1 overflow-auto custom-scrollbar"
                >
                    {isLoading ? (
                        <div className="h-full flex flex-col items-center justify-center space-y-4">
                            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                                <ArrowUpDown className="w-6 h-6 text-brand-accent1 animate-spin" />
                            </div>
                            <span className="text-sm font-bold text-white/20 uppercase tracking-widest">Анализиране на данни...</span>
                        </div>
                    ) : data.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-white/30 space-y-6">
                            <div className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5">
                                <Filter className="w-12 h-12 text-white/10" />
                            </div>
                            <div className="text-center space-y-2">
                                <p className="text-lg font-bold text-white/60">Няма намерени служители</p>
                                <p className="text-sm text-white/20">Прецизирайте филтрите или качете нов набор от данни.</p>
                            </div>
                        </div>
                    ) : (
                        <div style={{ height: `${virtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
                            {virtualizer.getVirtualItems().map(virtualRow => {
                                const row = rows[virtualRow.index];
                                if (!row) return null;

                                return (
                                    <div
                                        key={virtualRow.key}
                                        onClick={() => setSelectedEmployee(row.original as any)}
                                        className="absolute top-0 left-0 w-full flex border-b border-white/[0.02] hover:bg-white/[0.04] transition-all cursor-pointer group/row"
                                        style={{
                                            height: `${virtualRow.size}px`,
                                            transform: `translateY(${virtualRow.start}px)`,
                                        }}
                                    >
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="flex w-full h-full relative"
                                        >
                                            {/* Hover Indicator */}
                                            <div className="absolute left-0 top-2 bottom-2 w-1 bg-brand-accent1 rounded-r-full opacity-0 group-hover/row:opacity-100 transition-opacity" />

                                            {row.getVisibleCells().map(cell => (
                                                <div
                                                    key={cell.id}
                                                    className="flex-1 flex items-center px-6"
                                                    style={{ width: cell.column.getSize(), flexGrow: cell.column.getSize() === 50 ? 0 : 1 }}
                                                >
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </div>
                                            ))}

                                            <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover/row:opacity-100 group-hover/row:translate-x-2 transition-all">
                                                <ChevronRight className="w-5 h-5 text-brand-accent1" />
                                            </div>
                                        </motion.div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Footer / Stats */}
            <div className="flex items-center justify-between px-6 py-4 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-md">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Системата работи нормално</span>
                    </div>
                </div>
                <div className="text-[10px] font-black text-white/40 uppercase tracking-widest flex gap-4">
                    <span>Показани: <span className="text-white">{rows.length}</span></span>
                    <span className="text-white/10">|</span>
                    <span>Общо: <span className="text-white">{data.length}</span></span>
                </div>
            </div>
        </div>
    );
};
