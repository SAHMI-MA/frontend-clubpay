"use client"

import { useState } from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { TopBar } from "@/components/top-bar"
import { Dashboard } from "@/components/dashboard"
import { UserManagement } from "@/components/user-management"
import { ClubManagement } from "@/components/club-management"
import { FinancialManagement } from "@/components/financial-management"
import { MatchManagement } from "@/components/match-management"
import { AssociationSettings } from "@/components/association-settings"

export function SportsManagementApp() {
  const [currentPage, setCurrentPage] = useState("dashboard")
  const [darkMode, setDarkMode] = useState(false)

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard />
      case "users":
        return <UserManagement />
      case "clubs":
        return <ClubManagement />
      case "financial":
        return <FinancialManagement />
      case "matches":
        return <MatchManagement />
      case "settings":
        return <AssociationSettings />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className={darkMode ? "dark" : ""}>
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-gray-50 dark:bg-gray-900">
          <AppSidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
          <div className="flex-1 flex flex-col min-w-0">
            <TopBar darkMode={darkMode} setDarkMode={setDarkMode} />
            <main className="flex-1 p-6 overflow-auto">{renderCurrentPage()}</main>
          </div>
        </div>
      </SidebarProvider>
    </div>
  )
}
