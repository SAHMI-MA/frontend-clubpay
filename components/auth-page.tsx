"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import { loginUser } from "@/lib/redux/authThunks"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, Eye, EyeOff, Moon, Sun, AlertCircle, Loader2 } from "lucide-react"
import { associationAPI, type AssociationSettings } from "@/lib/api/association-api"
import { apiConfig } from "@/lib/api-config"

interface AuthPageProps {
  onLogin: (userData: { name: string; email: string; role: string }) => void
  darkMode: boolean
  setDarkMode: (darkMode: boolean) => void
}

export function AuthPage({ onLogin, darkMode, setDarkMode }: AuthPageProps) {
  const [loginData, setLoginData] = useState({ email: "", password: "" })
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [associationSettings, setAssociationSettings] = useState<AssociationSettings | null>(null)
  const [settingsLoading, setSettingsLoading] = useState(true)
  
  const dispatch = useAppDispatch();
  const { loading, isAuthenticated, user } = useAppSelector(state => state.auth);
  
  // Load association settings on component mount
  useEffect(() => {
    const loadAssociationSettings = async () => {
      try {
        setSettingsLoading(true)
        const settings = await associationAPI.getSettings()
        setAssociationSettings(settings)
      } catch (error) {
        console.error("Failed to load association settings:", error)
        // Set fallback values if API fails
        setAssociationSettings({
          id: 0,
          name: "Système",
          nameInArabic: "",
          tagline: "Système de gestion",
          logoUrl: undefined,
          foundedAt: new Date(),
          description: "",
          legalIdentifiers: "",
          contactEmail: "",
          contactPhone: "",
          address: "",
          primaryColor: "#1e40af",
          secondaryColor: "#3b82f6",
          createdAt: "",
          updatedAt: ""
        })
      } finally {
        setSettingsLoading(false)
      }
    }

    loadAssociationSettings()
  }, [])
  
  useEffect(() => {
    setIsLoading(loading);
  }, [loading]);
  
  useEffect(() => {
    if (isAuthenticated && user) {
      const fullName = `${user.firstName} ${user.lastName}`;
      onLogin({
        name: fullName,
        email: user.email,
        role: user.roles?.name || "User",
      });
    }
  }, [isAuthenticated, user, onLogin]);
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError("")

    try {
      if (!loginData.email || !loginData.password) {
        setLoginError("Veuillez entrer l'email et le mot de passe")
        return;
      }

      // Dispatch login action
      await dispatch(loginUser({
        email: loginData.email,
        password: loginData.password
      })).unwrap().catch((error) => {
        console.error("Login error:", error);
        setLoginError(typeof error === 'string' ? error : "Échec de la connexion. Veuillez vérifier vos identifiants.");
      });
      
    } catch (error) {
      console.error("Login error:", error);
      setLoginError(error instanceof Error ? error.message : "Échec de la connexion. Veuillez vérifier vos identifiants.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800 p-4">
      {/* Dark mode toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setDarkMode(!darkMode)}
        className="absolute top-4 right-4 text-gray-600 dark:text-gray-400"
      >
        {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>

      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            {settingsLoading ? (
              <div className="p-3 bg-blue-800 rounded-full">
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              </div>
            ) : associationSettings?.logoUrl ? (
              <div className="w-14 h-14 rounded-full overflow-hidden bg-white shadow-lg">
                <img
                  src={`${apiConfig.baseUrl}${associationSettings.logoUrl}`}
                  alt={`Logo ${associationSettings.name}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to shield icon if image fails to load
                    e.currentTarget.style.display = 'none'
                    e.currentTarget.parentElement!.innerHTML = `
                      <div class="p-3 bg-blue-800 rounded-full w-14 h-14 flex items-center justify-center">
                        <svg class="h-8 w-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M9 12l2 2 4-4"/>
                          <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"/>
                          <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"/>
                          <path d="M12 3c0 1-1 3-3 3s-3-2-3-3 1-3 3-3 3 2 3 3"/>
                          <path d="M12 21c0-1 1-3 3-3s3 2 3 3-1 3-3 3-3-2-3-3"/>
                        </svg>
                      </div>
                    `
                  }}
                />
              </div>
            ) : (
              <div className="p-3 bg-blue-800 rounded-full">
                <Shield className="h-8 w-8 text-white" />
              </div>
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {settingsLoading ? "Chargement..." : associationSettings?.name || "Système"}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {settingsLoading ? "Préparation de l'interface..." : associationSettings?.tagline || "Système de gestion"}
          </p>
        </div>

        <Tabs defaultValue="login" className="space-y-4">

          {/* Login Tab */}
          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Bienvenue</CardTitle>
                <CardDescription>Connectez-vous à votre compte pour continuer</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  {loginError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{loginError}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="Entrez votre email"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Mot de passe</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Entrez votre mot de passe"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-blue-800 hover:bg-blue-900 text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? "Connexion en cours..." : "Connexion"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Registration Tab removed */}
        </Tabs>

        {/* Footer removed */}
      </div>
    </div>
  )
}
