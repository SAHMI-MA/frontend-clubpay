"use client"

import {
  Shield,
  ChevronDown,
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
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { authUtils } from "@/lib/redux/auth-utils"
import { Permissions } from "@/lib/auth-service"
import { associationAPI, AssociationSettings, navigationGroups } from "@/lib/api/association-api"
import { useEffect, useState } from "react"


interface AppSidebarProps {
  currentPage: string
  setCurrentPage: (page: string) => void
}

export function AppSidebar({ currentPage, setCurrentPage }: AppSidebarProps) {
  const user = authUtils.getUser()
  const [associationSettings, setAssociationSettings] = useState<AssociationSettings | null>(null)
  const [baseUrl, setBaseUrl] = useState<string>("")
  const getAssociationSettings = async () => {
    try {
      const settings = await associationAPI.getSettings()
      const baseUrl = associationAPI.baseURL
      setAssociationSettings(settings)
      setBaseUrl(baseUrl)
    } catch (error) {
      console.error("Failed to fetch association settings:", error)
      setAssociationSettings(null)
    }
  }
  useEffect(() => {
    getAssociationSettings()
  }, [])


  const userPermissions = new Set<string>()
  if (user && Array.isArray(user.roles)) {
    user.roles.forEach(role => {
      if (Array.isArray(role.permissions)) {
        role.permissions.forEach((perm: Permissions) => {
          if (perm && perm.page) {
            userPermissions.add(perm.page)
            userPermissions.add(`${perm.page}.view`)
          }
        })
      }
    })
  }

  // Helper to check if user can view a page
  const canView = (pageId: string) => {
    // Check for either exact match or .view permission
    return userPermissions.has(pageId) || userPermissions.has(`${pageId}.view`)
  }

  // Filter navigation groups and items based on permissions
  const filteredGroups = navigationGroups
    .map(group => ({
      ...group,
      items: group.items.filter(item => canView(item.id)),
    }))
    .filter(group => group.items.length > 0)
  return (
    <Sidebar className="border-r border-gray-200 dark:border-gray-700">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
            {
            associationSettings != null && associationSettings.logoUrl != null ?
            <img
              src={`${baseUrl}${associationSettings.logoUrl}`}
              alt="Association Logo"
              className="h-16 w-16 rounded-full object-cover"
              style={{ aspectRatio: "1 / 1" }}
            />
            : <Shield className="h-8 w-8 text-blue-800 dark:text-blue-400" />
            }
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{associationSettings?.name}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">{associationSettings?.tagline}</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {filteredGroups.map((group) => (
          <Collapsible key={group.title} defaultOpen className="group/collapsible">
            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="flex w-full items-center justify-between text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200">
                  {group.title}
                  <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => (
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
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}
      </SidebarContent>
    </Sidebar>
  )
}

