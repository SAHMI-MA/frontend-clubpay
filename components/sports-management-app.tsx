"use client"

import { useState, useEffect } from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { TopBar } from "@/components/top-bar"
import { Dashboard } from "@/components/dashboard"
import { UserManagement } from "@/components/user-management"
import { TeamManagement } from "@/components/team-management"
import { FinancialManagement } from "@/components/financial-management"
import { MatchManagement } from "@/components/match-management"
import { AssociationSettings } from "@/components/association-settings"
import { AuthPage } from "@/components/auth-page"
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import { logoutUser } from "@/lib/redux/authThunks"
import { PlayerManagement } from "./player-management"
import { StaffManagement } from "./team-management/staff-management"
import { RentalSupplierManagement } from "./rental-supplies-management"
import { SupplierManagement } from "./supplier-management"
import { ContractManagement } from "./contract-management"

export function SportsManagementApp() {
  const [currentPage, setCurrentPage] = useState("dashboard")
  const [darkMode, setDarkMode] = useState(false)
  
  // Use Redux for authentication state
  const dispatch = useAppDispatch();
  const { isAuthenticated, user: reduxUser } = useAppSelector(state => state.auth);
  
  // Transform Redux user data to the format expected by components
  const user = reduxUser ? {
    name: `${reduxUser.firstName} ${reduxUser.lastName}`,
    email: reduxUser.email,
    role: reduxUser.role || 'User'
  } : null;

  const handleLogin = (userData: { name: string; email: string; role: string }) => {
  }

  const handleLogout = () => {
    dispatch(logoutUser());
    setCurrentPage("dashboard");
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard />
      case "users":
        return <UserManagement />
      case "clubs":
        return <TeamManagement />
      case "players":
        return <PlayerManagement />
      case "staff":
        return <StaffManagement />
      case "rentals":
        return <RentalSupplierManagement />
      case "suppliers":
        return <SupplierManagement />
      case "financial":
        return <FinancialManagement />
      case "contracts":
        return <ContractManagement />
      case "matches":
        return <MatchManagement />
      case "settings":
        return <AssociationSettings />
      default:
        return <Dashboard />
    }
  }

  // Show authentication page if not logged in
  if (!isAuthenticated) {
    return (
      <div className={darkMode ? "dark" : ""}>
        <AuthPage onLogin={handleLogin} darkMode={darkMode} setDarkMode={setDarkMode} />
      </div>
    )
  }

  return (
    <div className={darkMode ? "dark" : ""}>
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-gray-50 dark:bg-gray-900">
          <AppSidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
          <div className="flex-1 flex flex-col min-w-0">
            <TopBar darkMode={darkMode} setDarkMode={setDarkMode} user={user} onLogout={handleLogout} />
            <main className="flex-1 p-6 overflow-auto">{renderCurrentPage()}</main>
          </div>
        </div>
      </SidebarProvider>
    </div>
  )
}
