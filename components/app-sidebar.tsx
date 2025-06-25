"use client"

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
    title: "Rental & Suppliers",
    icon: Warehouse,
    id: "rentals",
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
  return (
    <Sidebar className="border-r border-gray-200 dark:border-gray-700">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <Shield className="h-8 w-8 text-blue-800 dark:text-blue-400" />
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Sports Manager</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Association System</p>
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
        <div className="text-xs text-gray-500 dark:text-gray-400">© 2024 Sports Association</div>
      </SidebarFooter>
    </Sidebar>
  )
}
