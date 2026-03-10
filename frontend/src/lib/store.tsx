import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { api } from '../services/api';

interface AppState {
    currentWorkspace: string;
    setCurrentWorkspace: (workspace: string) => void;
    sidebarExpanded: boolean;
    toggleSidebar: () => void;
    activeTab: string;
    setActiveTab: (tab: string) => void;
    selectedEmployee: any | null;
    setSelectedEmployee: (employee: any | null) => void;
    dashboardStats: any | null;
    setDashboardStats: (stats: any | null) => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
    const [currentWorkspace, setCurrentWorkspace] = useState('Глобални Операции');
    const [sidebarExpanded, setSidebarExpanded] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedEmployee, setSelectedEmployee] = useState(null);

    // Persist dashboardStats across sessions — data lives in the DB, but
    // the aggregated API response is cached in localStorage so HR managers
    // don't need to re-upload data after logging out and back in.
    const [dashboardStats, _setDashboardStats] = useState<any | null>(() => {
        try {
            const saved = localStorage.getItem('dashboardStats');
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    });

    const setDashboardStats = (stats: any | null) => {
        _setDashboardStats(stats);
        if (stats === null) {
            localStorage.removeItem('dashboardStats');
        } else {
            try {
                localStorage.setItem('dashboardStats', JSON.stringify(stats));
            } catch {
                // Quota exceeded — skip silently
            }
        }
    };

    const toggleSidebar = () => setSidebarExpanded(!sidebarExpanded);

    // Fetch workspace/org name on mount
    useEffect(() => {
        const loadOrg = async () => {
            try {
                const res = await api.getOrganization();
                if (res?.organization_name) {
                    setCurrentWorkspace(res.organization_name);
                }
            } catch (err) {
                console.warn("Could not load organization name", err);
            }
        };
        loadOrg();
    }, []);

    return (
        <AppContext.Provider value={{
            currentWorkspace, setCurrentWorkspace,
            sidebarExpanded, toggleSidebar,
            activeTab, setActiveTab,
            selectedEmployee, setSelectedEmployee,
            dashboardStats, setDashboardStats
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppState = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppState must be used within an AppProvider');
    }
    return context;
};
