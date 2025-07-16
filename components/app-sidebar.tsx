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
  UserCheck,
  Truck,
  UserCog,
  DollarSign,
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
  SidebarFooter,
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

const navigationGroups = [
  {
    title: "Overview",
    items: [
      {
        title: "Dashboard",
        icon: Home,
        id: "dashboard",
      },
    ],
  },
  {
    title: "Management",
    items: [
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
        icon: UserCheck,
        id: "staff",
      },
    ],
  },
  {
    title: "Human Resources",
    items: [
      {
        title: "HR Management",
        icon: UserCog,
        id: "hr",
      },
      {
        title: "Employee Files",
        icon: FileText,
        id: "employee-files",
      },
      {
        title: "Absence & Leave",
        icon: Calendar,
        id: "absence-leave",
      },
      {
        title: "Salary Payments",
        icon: DollarSign,
        id: "salary-payments",
      },
    ],
  },
  {
    title: "Operations",
    items: [
      {
        title: "Rental & Acquisitions",
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
    ],
  },
  {
    title: "Sports",
    items: [
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
    ],
  },
  {
    title: "System",
    items: [
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
    ],
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
        {navigationGroups.map((group) => (
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

      <SidebarFooter className="p-4">
        <div className="text-xs text-gray-500 dark:text-gray-400">© 2024 Sports Association</div>
      </SidebarFooter>
    </Sidebar>
  )
}
