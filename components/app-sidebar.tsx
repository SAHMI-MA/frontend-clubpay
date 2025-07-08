"use client"

import { useState, useEffect } from "react"
import {
  BarChart3,
  Building2,
  Calendar,
  CreditCard,
  FileText,
  Home,
  Settings,
  Shield,
  Trophy,
  Truck,
  Users,
  Warehouse,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { getApiUrl } from "@/lib/api-config"

// Types
interface AssociationSettings {
  id: number
  name: string
  description: string
  contactEmail: string
  contactPhone: string
  address: string
  primaryColor: string
  secondaryColor: string
  tagline: string
  logoUrl?: string
  createdAt: string
  updatedAt: string
}

const menuItems = [
  {
    title: "Dashboard",
    icon: Home,
    id: "dashboard",
  },
  {
    title: "User Management",
    icon: Users,
    id: "users",
  },
  {
    title: "Club & Teams",
    icon: Building2,
    id: "clubs",
  },
  {
    title: "Player Management",
    icon: Users,
    id: "players",
  },
  {
    title: "Staff Management",
    icon: Users,
    id: "staff",
  },
  {
    title: "Rental and Acquisitions",
    icon: Warehouse,
    id: "rentals",
  },
  {
    title: "Supplier Management",
    icon: Truck,
    id: "suppliers",
  },
  {
    title: "Financial",
    icon: CreditCard,
    id: "financial",
  },
  {
    title: "Contracts & Bonuses",
    icon: FileText,
    id: "contracts",
  },
  {
    title: "Objectives & Rewards",
    icon: Trophy,
    id: "objectives",
  },
  {
    title: "Match Management",
    icon: Calendar,
    id: "matches",
  },
  {
    title: "Analytics",
    icon: BarChart3,
    id: "analytics",
  },
  {
    title: "Settings & Logs",
    icon: Settings,
    id: "settings",
  },
]

interface AppSidebarProps {
  currentPage: string
  setCurrentPage: (page: string) => void
}

export function AppSidebar({ currentPage, setCurrentPage }: AppSidebarProps) {
  const [associationSettings, setAssociationSettings] = useState<AssociationSettings | null>(null)
  const [logoError, setLogoError] = useState(false)

  useEffect(() => {
    const fetchAssociationSettings = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        }
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`
        }

        const response = await fetch(getApiUrl('/associations/settings'), {
          headers
        })
        
        if (response.ok) {
          const settings = await response.json()
          setAssociationSettings(settings)
          setLogoError(false) // Reset logo error when fetching new settings
        }
      } catch (error) {
        console.error('Failed to fetch association settings:', error)
        // Silently fail - we'll show default branding
      }
    }

    fetchAssociationSettings()

    // Listen for association settings updates
    const handleSettingsUpdate = () => {
      fetchAssociationSettings()
    }

    window.addEventListener('associationSettingsUpdated', handleSettingsUpdate)

    return () => {
      window.removeEventListener('associationSettingsUpdated', handleSettingsUpdate)
    }
  }, [])

  const handleLogoError = () => {
    setLogoError(true)
  }

  const displayName = associationSettings?.name || "Sports Manager"
  const displayTagline = associationSettings?.tagline || "Association System"
  const logoUrl = associationSettings?.logoUrl && !logoError 
    ? `http://localhost:8080${associationSettings.logoUrl}` 
    : null

  return (
    <Sidebar className="border-r border-gray-200 dark:border-gray-700">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-800">
              <img 
                src={logoUrl} 
                alt={`${displayName} Logo`}
                className="w-full h-full object-cover"
                onError={handleLogoError}
              />
            </div>
          ) : (
            <Shield className="h-8 w-8 text-blue-800 dark:text-blue-400 flex-shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate">{displayName}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{displayTagline}</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-600 dark:text-gray-400">Main Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => setCurrentPage(item.id)}
                    isActive={currentPage === item.id}
                    className="w-full justify-start hover:bg-blue-50 dark:hover:bg-blue-900/20 data-[active=true]:bg-blue-100 dark:data-[active=true]:bg-blue-900/30 data-[active=true]:text-blue-800 dark:data-[active=true]:text-blue-400"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          © 2024 {associationSettings?.name || "Sports Association"}
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
