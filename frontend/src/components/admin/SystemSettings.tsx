import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Globe, Key, CheckCircle2, Shield,
    Database, Activity, Zap, Save, RotateCcw
} from 'lucide-react';

const SettingRow = ({ label, description, children }: {
    label: string; description: string; children: React.ReactNode
}) => (
    <div className="flex items-center justify-between py-4 border-b border-white/5 last:border-0">
        <div>
            <p className="text-sm font-medium text-white/80">{label}</p>
            <p className="text-xs text-white/30 mt-0.5">{description}</p>
        </div>
        <div className="ml-6 shrink-0">{children}</div>
    </div>
);

const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button
        onClick={onChange}
        className={`relative w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none
            ${checked ? 'bg-blue-500' : 'bg-white/10'}`}
    >
        <motion.div
            animate={{ x: checked ? 20 : 2 }}
            className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow"
        />
    </button>
);

const HealthIndicator = ({ label, status, value }: { label: string; status: 'ok' | 'warn'; value: string }) => (
    <div className="flex items-center justify-between py-2.5">
        <div className="flex items-center gap-2.5">
            <div className={`w-2 h-2 rounded-full ${status === 'ok' ? 'bg-green-400' : 'bg-amber-400'}`} />
            <span className="text-sm text-white/60">{label}</span>
        </div>
        <span className={`text-xs font-semibold ${status === 'ok' ? 'text-green-400' : 'text-amber-400'}`}>{value}</span>
    </div>
);

export const SystemSettings = () => {
    const [orgName, setOrgName] = useState('Enterprise Corp');
    const [apiUrl, setApiUrl] = useState('http://localhost:8000');
    const [logRetention, setLogRetention] = useState('30');
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [autoRetrain, setAutoRetrain] = useState(true);
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    return (
        <div className="h-full overflow-y-auto space-y-6 pr-1">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-white">Системни Настройки</h1>
                    <p className="text-sm text-white/40 mt-0.5">Конфигурация на платформата и API</p>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                {/* Main Settings */}
                <div className="col-span-2 space-y-4">
                    {/* Organization */}
                    <div className="bg-white/[0.03] border border-white/8 rounded-xl p-5">
                        <div className="flex items-center gap-2 mb-1">
                            <Globe size={15} className="text-blue-400" />
                            <h2 className="text-sm font-semibold text-white/80">Организация</h2>
                        </div>
                        <p className="text-xs text-white/30 mb-4">Основни настройки на организацията</p>
                        <SettingRow label="Название на Организацията" description="Показва се в навигацията">
                            <input
                                value={orgName}
                                onChange={e => setOrgName(e.target.value)}
                                className="bg-white/[0.05] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white/80 focus:outline-none focus:border-blue-500/50 transition-colors w-48"
                            />
                        </SettingRow>
                        <SettingRow label="Задържане на Логове" description="Брой дни за съхранение на логове">
                            <select
                                value={logRetention}
                                onChange={e => setLogRetention(e.target.value)}
                                className="bg-white/[0.05] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white/80 focus:outline-none focus:border-blue-500/50 transition-colors"
                            >
                                <option value="7">7 дни</option>
                                <option value="30">30 дни</option>
                                <option value="90">90 дни</option>
                                <option value="365">1 година</option>
                            </select>
                        </SettingRow>
                    </div>

                    {/* API Config */}
                    <div className="bg-white/[0.03] border border-white/8 rounded-xl p-5">
                        <div className="flex items-center gap-2 mb-1">
                            <Key size={15} className="text-amber-400" />
                            <h2 className="text-sm font-semibold text-white/80">API Конфигурация</h2>
                        </div>
                        <p className="text-xs text-white/30 mb-4">Настройки за връзка с backend</p>
                        <SettingRow label="Backend URL" description="Основен API endpoint">
                            <input
                                value={apiUrl}
                                onChange={e => setApiUrl(e.target.value)}
                                className="bg-white/[0.05] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white/80 focus:outline-none focus:border-blue-500/50 transition-colors w-52 font-mono text-xs"
                            />
                        </SettingRow>
                        <SettingRow label="JWT Изтичане" description="Токен валидност">
                            <span className="text-sm text-white/50 font-mono">24h</span>
                        </SettingRow>
                    </div>

                    {/* System Behavior */}
                    <div className="bg-white/[0.03] border border-white/8 rounded-xl p-5">
                        <div className="flex items-center gap-2 mb-1">
                            <Zap size={15} className="text-purple-400" />
                            <h2 className="text-sm font-semibold text-white/80">Поведение на Системата</h2>
                        </div>
                        <p className="text-xs text-white/30 mb-4">Автоматизация и режими</p>
                        <SettingRow label="Автоматично Преобучение" description="Retrain при нови данни >500 записа">
                            <Toggle checked={autoRetrain} onChange={() => setAutoRetrain(!autoRetrain)} />
                        </SettingRow>
                        <SettingRow label="Режим на Поддръжка" description="Блокира достъп за не-admin потребители">
                            <Toggle checked={maintenanceMode} onChange={() => setMaintenanceMode(!maintenanceMode)} />
                        </SettingRow>
                    </div>

                    {/* Save button */}
                    <div className="flex gap-3">
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-500/20"
                        >
                            <Save size={14} />
                            Запази Промените
                        </button>
                        <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/8 text-white/60 font-semibold text-sm transition-all border border-white/8">
                            <RotateCcw size={14} />
                            Откажи
                        </button>
                        {saved && (
                            <motion.div
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-xl"
                            >
                                <CheckCircle2 size={13} className="text-green-400" />
                                <span className="text-xs text-green-300 font-medium">Запазено!</span>
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* System Health Sidebar */}
                <div className="space-y-4">
                    <div className="bg-white/[0.03] border border-white/8 rounded-xl p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <Activity size={15} className="text-green-400" />
                            <h2 className="text-sm font-semibold text-white/80">Статус на Системата</h2>
                        </div>
                        <div className="divide-y divide-white/5">
                            <HealthIndicator label="API Server" status="ok" value="ОНЛАЙН" />
                            <HealthIndicator label="ML Engine" status="ok" value="ОНЛАЙН" />
                            <HealthIndicator label="Database" status="ok" value="ОНЛАЙН" />
                            <HealthIndicator label="Cache" status="warn" value="82% заето" />
                            <HealthIndicator label="Disk Space" status="warn" value="14 GB свободни" />
                        </div>
                    </div>

                    <div className="bg-white/[0.03] border border-white/8 rounded-xl p-5 space-y-3">
                        <div className="flex items-center gap-2">
                            <Database size={15} className="text-white/40" />
                            <h2 className="text-sm font-semibold text-white/80">База Данни</h2>
                        </div>
                        {[
                            { label: 'Тип', value: 'SQLite' },
                            { label: 'Записи', value: '16,050' },
                            { label: 'Размер', value: '48.2 MB' },
                            { label: 'Последен бекъп', value: 'Вчера 02:00' },
                        ].map(({ label, value }) => (
                            <div key={label} className="flex justify-between text-xs">
                                <span className="text-white/30">{label}</span>
                                <span className="text-white/60 font-medium">{value}</span>
                            </div>
                        ))}
                    </div>

                    <div className="bg-white/[0.03] border border-white/8 rounded-xl p-5 space-y-3">
                        <div className="flex items-center gap-2">
                            <Shield size={15} className="text-white/40" />
                            <h2 className="text-sm font-semibold text-white/80">Сигурност</h2>
                        </div>
                        {[
                            { label: 'Метод на Авт.', value: 'JWT' },
                            { label: 'HTTPS', value: 'Активен' },
                            { label: 'Роли', value: '3 дефинирани' },
                            { label: 'Активни сесии', value: '2' },
                        ].map(({ label, value }) => (
                            <div key={label} className="flex justify-between text-xs">
                                <span className="text-white/30">{label}</span>
                                <span className="text-white/60 font-medium">{value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
