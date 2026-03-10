import { useState, useEffect } from "react"
import { AppProvider, useAppState } from "./lib/store"
import { AuthProvider, useAuth } from "./lib/auth"
import { Login } from "./components/auth/Login"
import { MainLayout } from "./components/layout/MainLayout"
import { Overview } from "./components/dashboard/Overview"
import { WorkforceTable } from "./components/workforce-intelligence/WorkforceTable"
import { WhatIfSimulator } from "./components/dashboard/WhatIfSimulator"
import { UserManagement } from "./components/dashboard/UserManagement"
import { LandingPage } from "./components/landing/LandingPage"
import { ModelAnalysis } from "./components/admin/ModelAnalysis"
import { ModelOptimization } from "./components/admin/ModelOptimization"
import { SystemSettings } from "./components/admin/SystemSettings"
import { DepartmentOverview } from "./components/dashboard/DepartmentOverview"
import { AnalysisHistory } from "./components/dashboard/AnalysisHistory"

import { DeepAnalysis } from "./components/dashboard/DeepAnalysis"
import { AnimatePresence, motion } from "framer-motion"

const DEFAULT_TAB: Record<string, string> = {
  system_admin: 'model_analysis',
  hr_manager: 'overview',
  department_head: 'dept_overview',
}

const AppContent = () => {
  const { activeTab, selectedEmployee, setSelectedEmployee, setActiveTab } = useAppState()
  const { role } = useAuth()

  // Set default tab based on role on first mount
  useEffect(() => {
    if (role && DEFAULT_TAB[role]) {
      setActiveTab(DEFAULT_TAB[role])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role])

  // Overlay for Deep Dive - only show when NOT on simulator tab
  const showDeepDive = !!selectedEmployee && activeTab !== 'simulator'

  return (
    <>
      <div className="h-full">
        {activeTab === 'overview' && <Overview />}
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'workforce' && <WorkforceTable />}
        {activeTab === 'simulator' && <WhatIfSimulator />}
        {activeTab === 'model_analysis' && <ModelAnalysis />}
        {activeTab === 'model_optimization' && <ModelOptimization />}
        {activeTab === 'settings' && <SystemSettings />}
        {activeTab === 'dept_overview' && <DepartmentOverview />}
        {activeTab === 'analysis_history' && <AnalysisHistory />}
      </div>

      <AnimatePresence>
        {showDeepDive && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedEmployee(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 right-0 w-[600px] bg-[#0F1117] border-l border-white/10 shadow-2xl z-50 overflow-y-auto p-6"
            >
              <DeepAnalysis employeeId={selectedEmployee.id ?? 0} onBack={() => setSelectedEmployee(null)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

const ProtectedApp = () => {
  const { isAuthenticated } = useAuth()
  const [showLogin, setShowLogin] = useState(false)

  if (!isAuthenticated) {
    if (showLogin) {
      return <Login onBack={() => setShowLogin(false)} />
    }
    return <LandingPage onLoginClick={() => setShowLogin(true)} />
  }

  return (
    <AppProvider>
      <MainLayout>
        <AppContent />
      </MainLayout>
    </AppProvider>
  )
}

function App() {
  return (
    <AuthProvider>
      <ProtectedApp />
    </AuthProvider>
  )
}

export default App
