"use client"

import { useState } from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { TopBar } from "@/components/top-bar"
import { Dashboard } from "@/components/dashboard"
import { UserManagement } from "@/components/Management/user-management"
import { TeamManagement } from "@/components/Management/team-management"
import { FinancialManagement } from "@/components/Operations/financial-management"
import { MatchManagement } from "@/components/Management/match-management"
import { AssociationSettings } from "@/components/System/association-settings"
import { AuthPage } from "@/components/auth-page"
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import { logoutUser } from "@/lib/redux/authThunks"
import { PlayerManagement } from "./Management/player-management"
import { StaffManagement } from "./team-management/staff-management"
import { CategoryManagement } from "./team-management/category-management"
import { RentalSupplierManagement } from "./Operations/rental-supplies-management"
import { SupplierManagement } from "./Operations/supplier-management"
import { ContractManagement } from "./Management/contract-management"
import { ObjectivesManagement } from "./Management/objective-management"
import { HRManagement } from "./HR/hr-management"
import { AbsenceLeaveManagement } from "./HR/absence-leave-management"
import { EmployeeFilesManagement } from "./HR/employee-files-management"
import { SalaryPaymentManagement } from "./HR/salary-payment-management"
import { ClubSalaryPaymentsManagement } from "./Management/club-salary-payments-management"
import { StockManagement } from "./Operations/stock-management"
import { AllocationManagement } from "./Operations/allocation-management"
import { ProfilePage } from "./profile-page"
import { AssetInventoryManagement } from "./Operations/assets-inventory-management"

export function SportsManagementApp() {
  const [currentPage, setCurrentPage] = useState("dashboard")
  const [darkMode, setDarkMode] = useState(false)

  const dispatch = useAppDispatch();
  const { isAuthenticated, user: reduxUser } = useAppSelector(state => state.auth);

  // Transform Redux user data to the format expected by components
  const user = reduxUser ? {
    name: `${reduxUser.firstName} ${reduxUser.lastName}`,
    email: reduxUser.email,
    role: reduxUser.roles?.name || 'User'
  } : null;

  const handleLogin = (userData: { name: string; email: string; role: string }) => {
    console.log("User logged in:", userData);
  }

  const handleLogout = () => {
    dispatch(logoutUser());
    setCurrentPage("dashboard");
  }

  const handleNavigateToProfile = () => {
    setCurrentPage("profile");
  }

  const handleNavigateToSettings = () => {
    setCurrentPage("settings");
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard />
      case "users":
        return <UserManagement />
      case "clubs":
        return <TeamManagement />
      case "categories":
        return <CategoryManagement />
      case "players":
        return <PlayerManagement />
      case "staff":
        return <StaffManagement />
      case "hr":
        return <HRManagement />
      case "employee-files":
        return <EmployeeFilesManagement />
      case "absence-leave":
        return <AbsenceLeaveManagement />
      case "salary-payments":
        return <SalaryPaymentManagement />
      case "club-salary-payments":
        return <ClubSalaryPaymentsManagement />
      case "stock-management":
        return <StockManagement />
      case "allocation-management":
        return <AllocationManagement />
      case "rental":
        return <RentalSupplierManagement />
      case "suppliers":
        return <SupplierManagement />
      case "financial":
        return <FinancialManagement />
      case "contracts":
        return <ContractManagement />
      case "objectives":
        return <ObjectivesManagement />
      case "matches":
        return <MatchManagement />
      case "settings":
        return <AssociationSettings />
      case "profile":
        return <ProfilePage />
      case "asset-inventory":
        return <AssetInventoryManagement />
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
            <TopBar 
              darkMode={darkMode} 
              setDarkMode={setDarkMode} 
              user={user} 
              onLogout={handleLogout}
              onNavigateToProfile={handleNavigateToProfile}
              onNavigateToSettings={handleNavigateToSettings}
            />
            <main className="flex-1 p-6 overflow-auto">{renderCurrentPage()}</main>
          </div>
        </div>
      </SidebarProvider>
    </div>
  )
}
