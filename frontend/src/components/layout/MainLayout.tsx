import React from 'react';
import { Sidebar } from '../shared/Sidebar';

export const MainLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="flex h-screen bg-[#09090f] text-white overflow-hidden font-sans relative">
            {/* ── Continuous full-page gradient background (Matching Landing) ── */}
            <div className="fixed inset-0 pointer-events-none z-0">
                {/* Top-centre blue bloom */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-5%,rgba(79,126,247,0.12)_0%,transparent_65%)]" />
                {/* Mid-left indigo */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_0%_45%,rgba(99,102,241,0.08)_0%,transparent_65%)]" />
                {/* Mid-right indigo */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_45%_35%_at_100%_55%,rgba(99,102,241,0.07)_0%,transparent_65%)]" />
                {/* Dot grid */}
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.65) 1px, transparent 1px)",
                        backgroundSize: "32px 32px",
                    }}
                />
            </div>

            <Sidebar />

            <div className="flex-1 flex flex-col min-w-0 relative z-10">
                <main className="flex-1 overflow-hidden p-6 relative">
                    <div className="relative h-full max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};
