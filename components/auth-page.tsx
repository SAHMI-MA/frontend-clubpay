"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import { loginUser, registerUser } from "@/lib/redux/authThunks"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, Eye, EyeOff, Moon, Sun, AlertCircle, CheckCircle } from "lucide-react"

interface AuthPageProps {
  onLogin: (userData: { name: string; email: string; role: string }) => void
  darkMode: boolean
  setDarkMode: (darkMode: boolean) => void
}

export function AuthPage({ onLogin, darkMode, setDarkMode }: AuthPageProps) {
  const [loginData, setLoginData] = useState({ email: "", password: "" })
  const [registerData, setRegisterData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loginError, setLoginError] = useState("")
  const [registerError, setRegisterError] = useState("")
  const [registerSuccess, setRegisterSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  
  const dispatch = useAppDispatch();
  const { loading, isAuthenticated, user } = useAppSelector(state => state.auth);
  
  useEffect(() => {
    setIsLoading(loading);
  }, [loading]);
  
  useEffect(() => {
    if (isAuthenticated && user) {
      const fullName = `${user.firstName} ${user.lastName}`;
      onLogin({
        name: fullName,
        email: user.email,
        role: user.role || "User",
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
  
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setRegisterError("")
    setRegisterSuccess("")
    
    try {
      if (!registerData.firstName || !registerData.lastName || !registerData.email || !registerData.password) {
        setRegisterError("Veuillez remplir tous les champs obligatoires")
        return
      }

      if (registerData.password !== registerData.confirmPassword) {
        setRegisterError("Les mots de passe ne correspondent pas")
        return
      }

      if (registerData.password.length < 6) {
        setRegisterError("Le mot de passe doit contenir au moins 6 caractères")
        return
      }// Dispatch register action
      await dispatch(registerUser({
        firstName: registerData.firstName,
        lastName: registerData.lastName,
        email: registerData.email,
        password: registerData.password      })).unwrap().then(() => {
        setRegisterSuccess("Compte créé avec succès ! Vous pouvez maintenant vous connecter.");
        
        // Reset form on success
        setRegisterData({ 
          firstName: "", 
          lastName: "", 
          email: "", 
          password: "", 
          confirmPassword: "", 
          role: "" // Keep this for type compatibility, even though not used in UI
        });
      }).catch((error) => {
        console.error("Registration error:", error);
        setRegisterError(typeof error === 'string' ? error : "Échec de l'inscription. Veuillez réessayer.");
      })
      
    } catch (error) {
      console.error("Registration error:", error);
      setRegisterError(error instanceof Error ? error.message : "Échec de l'inscription. Veuillez réessayer.");
    }    // No need to manually set isLoading to false since it's controlled by the Redux state
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
            <div className="p-3 bg-blue-800 rounded-full">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestionnaire Sportif</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Système de gestion d'association</p>
        </div>

        <Tabs defaultValue="login" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Connexion</TabsTrigger>
            {/* Registration tab removed */}
          </TabsList>

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
