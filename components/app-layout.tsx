"use client"

import { useState } from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { TopBar } from "@/components/top-bar"
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import { logoutUser } from "@/lib/redux/authThunks"
import { useRouter } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const [darkMode, setDarkMode] = useState(false)
  const dispatch = useAppDispatch()
  const router = useRouter()
  const { user: reduxUser } = useAppSelector(state => state.auth)

  // Transform Redux user data to the format expected by components
  const user = reduxUser ? {
    name: `${reduxUser.firstName} ${reduxUser.lastName}`,
    email: reduxUser.email,
    role: reduxUser.roles?.name || 'User'
  } : null

  const handleLogout = () => {
    dispatch(logoutUser())
    router.push("/")
  }

  const handleNavigateToProfile = () => {
    router.push("/profile")
  }

  const handleNavigateToSettings = () => {
    router.push("/settings")
  }

  return (
    <AuthGuard>
      <div className={darkMode ? "dark" : ""}>
        <SidebarProvider>
          <div className="flex min-h-screen w-full bg-gray-50 dark:bg-gray-900">
            <AppSidebar />
            <div className="flex-1 flex flex-col min-w-0">
              <TopBar 
                darkMode={darkMode} 
                setDarkMode={setDarkMode} 
                user={user} 
                onLogout={handleLogout}
                onNavigateToProfile={handleNavigateToProfile}
                onNavigateToSettings={handleNavigateToSettings}
              />
              <main className="flex-1 p-6 overflow-auto">
                {children}
              </main>
            </div>
          </div>
        </SidebarProvider>
      </div>
    </AuthGuard>
  )
}