"use client"

import { useAppSelector } from "@/lib/redux/hooks"
import { AuthPage } from "@/components/auth-page"
import { useState } from "react"

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [darkMode, setDarkMode] = useState(false)
  const { isAuthenticated } = useAppSelector(state => state.auth)

  const handleLogin = (userData: { name: string; email: string; role: string }) => {
    console.log("User logged in:", userData)
  }

  // Show authentication page if not logged in
  if (!isAuthenticated) {
    return (
      <div className={darkMode ? "dark" : ""}>
        <AuthPage onLogin={handleLogin} darkMode={darkMode} setDarkMode={setDarkMode} />
      </div>
    )
  }

  return <>{children}</>
}