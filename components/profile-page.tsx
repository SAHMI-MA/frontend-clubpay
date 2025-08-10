"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Edit3, 
  Save, 
  X,
  Camera,
  Shield,
  Key,
} from "lucide-react"
import { useAppSelector } from "@/lib/redux/hooks"
import { RootState } from "@/lib/redux/store"
import { ToastNotification, useToast } from "@/components/ui/toast-notification"
import { authService } from "@/lib/auth-service"

interface UserProfile {
  id: number
  firstName: string
  lastName: string
  email: string
  phoneNumber?: string
  address?: string
  dateOfBirth?: string
  bio?: string
  profilePicture?: string
  roles?: {
    id: number
    name: string
    description?: string
  }
  createdAt: string
  updatedAt: string
}

export function ProfilePage() {
  const { toastState, showToast, hideToast } = useToast()
  const reduxUser = useAppSelector((state: RootState) => state.auth.user)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false)
  
  // Profile form state
  const [profileData, setProfileData] = useState<UserProfile>({
    id: 0,
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    address: "",
    dateOfBirth: "",
    bio: "",
    profilePicture: "",
    createdAt: "",
    updatedAt: ""
  })

  // Password change form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })

  // Initialize profile data from Redux user
  useEffect(() => {
    if (reduxUser) {
      setProfileData({
        id: reduxUser.id,
        firstName: reduxUser.firstName || "",
        lastName: reduxUser.lastName || "",
        email: reduxUser.email || "",
        phoneNumber: "", // Not available in Redux user
        address: "", // Not available in Redux user
        dateOfBirth: "", // Not available in Redux user
        bio: "", // Not available in Redux user
        profilePicture: "", // Not available in Redux user
        roles: reduxUser.roles,
        createdAt: "", // Not available in Redux user
        updatedAt: "" // Not available in Redux user
      })
    }
    
    // Check authentication status
    const token = authService.getToken()
    const isAuthenticated = authService.isAuthenticated()
    console.log('🔐 Authentication check:', { 
      hasToken: !!token, 
      tokenLength: token?.length || 0,
      isAuthenticated,
      hasReduxUser: !!reduxUser 
    })
  }, [reduxUser])

  const handleSaveProfile = async () => {
    setIsLoading(true)
    try {
      // Here you would call an API to update the user profile
      // For now, we'll just simulate the API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      showToast(
        "Profil mis à jour avec succès",
        "success",
        "Profil mis à jour"
      )
      setIsEditing(false)
    } catch (error) {
        console.error("Erreur lors de la mise à jour du profil:", error)
      showToast(
        "Erreur lors de la mise à jour du profil",
        "error",
        "Erreur"
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword) {
      showToast(
        "Veuillez saisir votre mot de passe actuel",
        "error",
        "Erreur"
      )
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast(
        "Les mots de passe ne correspondent pas",
        "error",
        "Erreur"
      )
      return
    }

    if (passwordForm.newPassword.length < 6) {
      showToast(
        "Le mot de passe doit contenir au moins 6 caractères",
        "error",
        "Erreur"
      )
      return
    }

    setIsLoading(true)
    try {
      // Debug authentication before API call
      const token = authService.getToken()
      const isAuthenticated = authService.isAuthenticated()
      console.log('🔑 Pre-API call auth check:', { 
        hasToken: !!token, 
        tokenLength: token?.length || 0,
        isAuthenticated 
      })
      
      if (!isAuthenticated) {
        showToast(
          "Vous devez être connecté pour changer votre mot de passe",
          "error",
          "Erreur d'authentification"
        )
        return
      }
      
      await authService.changePassword(passwordForm.currentPassword, passwordForm.newPassword)
      
      showToast(
        "Mot de passe modifié avec succès",
        "success",
        "Mot de passe modifié"
      )
      setIsChangePasswordOpen(false)
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      })
    } catch (error: any) {
      console.error("Erreur lors du changement de mot de passe:", error)
      showToast(
        error.message || "Erreur lors du changement de mot de passe",
        "error",
        "Erreur"
      )
    } finally {
      setIsLoading(false)
    }
  }

  // Test authentication function
  const testAuthentication = async () => {
    try {
      console.log('🧪 Testing authentication...')
      const token = authService.getToken()
      console.log('🔑 Token available:', !!token)
      
      if (!token) {
        showToast("No token found", "error", "Auth Test")
        return
      }

      // Test the auth/test endpoint
      const response = await fetch('http://localhost:8080/auth/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      console.log('🧪 Auth test response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('🧪 Auth test success:', data)
        showToast("Authentication test successful", "success", "Auth Test")
      } else {
        const errorText = await response.text()
        console.log('🧪 Auth test failed:', errorText)
        showToast(`Auth test failed: ${response.status}`, "error", "Auth Test")
      }
    } catch (error: any) {
      console.error('🧪 Auth test error:', error)
      showToast(`Auth test error: ${error.message}`, "error", "Auth Test")
    }
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <ToastNotification toast={toastState} onClose={hideToast} />
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mon Profil</h1>
          <p className="text-gray-600 dark:text-gray-400">Gérez vos informations personnelles et préférences</p>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
                disabled={isLoading}
              >
                <X className="h-4 w-4 mr-2" />
                Annuler
              </Button>
              <Button
                onClick={handleSaveProfile}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </>
          ) : (
            <Button
              onClick={() => setIsEditing(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Modifier le profil
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Overview Card */}
        <Card className="lg:col-span-1">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profileData.profilePicture} alt={`${profileData.firstName} ${profileData.lastName}`} />
                  <AvatarFallback className="text-xl font-semibold bg-blue-100 text-blue-600">
                    {getInitials(profileData.firstName, profileData.lastName)}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute -bottom-2 -right-2 rounded-full h-8 w-8 p-0"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <CardTitle className="text-xl">{profileData.firstName} {profileData.lastName}</CardTitle>
            <CardDescription>{profileData.email}</CardDescription>
            {profileData.roles && (
              <Badge variant="secondary" className="mt-2">
                <Shield className="h-3 w-3 mr-1" />
                {profileData.roles.name}
              </Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Mail className="h-4 w-4" />
                <span>{profileData.email}</span>
              </div>
              {profileData.phoneNumber && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Phone className="h-4 w-4" />
                  <span>{profileData.phoneNumber}</span>
                </div>
              )}
              {profileData.address && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <MapPin className="h-4 w-4" />
                  <span>{profileData.address}</span>
                </div>
              )}
              {profileData.dateOfBirth && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(profileData.dateOfBirth).toLocaleDateString()}</span>
                </div>
              )}
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-900 dark:text-white">Membre depuis</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {profileData.createdAt && new Date(profileData.createdAt).toLocaleDateString()}
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={testAuthentication}
              >
                <Shield className="h-4 w-4 mr-2" />
                Tester l'authentification
              </Button>
              
              <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Key className="h-4 w-4 mr-2" />
                    Changer le mot de passe
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Changer le mot de passe</DialogTitle>
                    <DialogDescription>
                      Entrez votre mot de passe actuel et choisissez un nouveau mot de passe.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsChangePasswordOpen(false)}>
                      Annuler
                    </Button>
                    <Button onClick={handleChangePassword} disabled={isLoading}>
                      {isLoading ? "Modification..." : "Changer le mot de passe"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Profile Details Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Informations personnelles</CardTitle>
            <CardDescription>
              Mettez à jour vos informations personnelles et coordonnées
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom</Label>
                <Input
                  id="firstName"
                  value={profileData.firstName}
                  onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nom de famille</Label>
                <Input
                  id="lastName"
                  value={profileData.lastName}
                  onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Adresse e-mail</Label>
              <Input
                id="email"
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                disabled={!isEditing}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Numéro de téléphone</Label>
                <Input
                  id="phoneNumber"
                  value={profileData.phoneNumber}
                  onChange={(e) => setProfileData({ ...profileData, phoneNumber: e.target.value })}
                  disabled={!isEditing}
                  placeholder="Ex: +212 6 12 34 56 78"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date de naissance</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={profileData.dateOfBirth}
                  onChange={(e) => setProfileData({ ...profileData, dateOfBirth: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                value={profileData.address}
                onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                disabled={!isEditing}
                placeholder="Ex: 123 Rue Mohammed V, Casablanca"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Biographie</Label>
              <Textarea
                id="bio"
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                disabled={!isEditing}
                placeholder="Parlez-nous un peu de vous..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
