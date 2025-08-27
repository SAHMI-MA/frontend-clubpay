// Association Settings API
import {
  BarChart3,
  Building2,
  Calendar,
  CreditCard,
  FileText,
  Home,
  Settings,
  Trophy,
  Users,
  Warehouse,
  UserCheck,
  Truck,
  UserCog,
  DollarSign,
  Package,
  ClipboardList,
} from "lucide-react"

export interface AssociationSettings {
  id: number
  name: string
  nameInArabic: string
  foundedAt: Date
  description: string
  legalIdentifiers: string
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

export interface UpdateAssociationSettingsDto {
  name?: string
  description?: string
  contactEmail?: string
  contactPhone?: string
  address?: string
  primaryColor?: string
  secondaryColor?: string
  tagline?: string
}

import { apiConfig } from '@/lib/api-config'

class AssociationAPIService {
  public baseURL = apiConfig.baseUrl
  private token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    }
  }

  async getSettings(): Promise<AssociationSettings> {
    const response = await fetch(`${this.baseURL}/associations/settings`, {
      headers: this.getHeaders()
    })
    if (!response.ok) throw new Error('Failed to fetch settings')
    return response.json()
  }

  async updateSettings(settings: UpdateAssociationSettingsDto): Promise<AssociationSettings> {
    const response = await fetch(`${this.baseURL}/associations/settings`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(settings)
    })
    if (!response.ok) throw new Error('Failed to update settings')
    return response.json()
  }

  async uploadLogo(file: File): Promise<AssociationSettings> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${this.baseURL}/associations/logo`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.token}` },
      body: formData
    })
    if (!response.ok) throw new Error('Failed to upload logo')
    return response.json()
  }

  async deleteLogo(): Promise<AssociationSettings> {
    const response = await fetch(`${this.baseURL}/associations/logo`, {
      method: 'DELETE',
      headers: this.getHeaders()
    })
    if (!response.ok) throw new Error('Failed to delete logo')
    return response.json()
  }
}

export const associationAPI = new AssociationAPIService()

export const navigationGroups = [
  {
    title: "Aperçu",
    items: [
      {
        title: "Tableau de bord",
        icon: Home,
        id: "dashboard",
      },
    ],
  },
  {
    title: "Gestion",
    items: [
      {
        title: "Gestion des utilisateurs",
        icon: Users,
        id: "users",
      },
      {
        title: "Clubs & Équipes",
        icon: Building2,
        id: "clubs",
      },
      {
        title: "Gestion des joueurs",
        icon: Users,
        id: "players",
      },
      {
        title: "Gestion du staff",
        icon: UserCheck,
        id: "staff",
      },
    ],
  },
  {
    title: "Ressources humaines",
    items: [
      {
        title: "Gestion RH",
        icon: UserCog,
        id: "hr",
      },
      {
        title: "Dossiers employés",
        icon: FileText,
        id: "employee-files",
      },
      {
        title: "Absences & Congés",
        icon: Calendar,
        id: "absence-leave",
      },
    ],
  },
  {
    title: "Gestion de la comptabilité",
    items: [
      {
        title: "Salaires Employés",
        icon: DollarSign,
        id: "salary-payments",
      },
      {
        title: "Salaires Club",
        icon: UserCog,
        id: "club-salary-payments",
      },
      {
        title: "Finances",
        icon: CreditCard,
        id: "financial",
      }
    ],
  },
  {
    title: "Service d'achat",
    items: [
      {
        title: "BDC Externe",
        icon: Warehouse,
        id: "rental",
      },
      {
        title: "Gestion des fournisseurs",
        icon: Truck,
        id: "suppliers",
      },
      {
        title: "BDC Interne",
        icon: ClipboardList,
        id: "allocation-management",
      },
    ],
  },
  {
    title: "Moyens généraux & patrimoine",
    items: [
      {
        title: "Gestion de Stocks",
        icon: Package,
        id: "stock-management",
      },
      {
        title: "Inventaire des biens",
        icon: Package,
        id: "asset-inventory",
      }
    ]
  },
  {
    title: "Sport",
    items: [
      {
        title: "Contrats & Primes",
        icon: FileText,
        id: "contracts",
      },
      {
        title: "Objectifs & Récompenses",
        icon: Trophy,
        id: "objectives",
      },
      {
        title: "Gestion des matchs",
        icon: Calendar,
        id: "matches",
      },
    ],
  },
  {
    title: "Système",
    items: [
      {
        title: "Analytique",
        icon: BarChart3,
        id: "analytics",
      },
      {
        title: "Paramètres & Journaux",
        icon: Settings,
        id: "settings",
      },
    ],
  },
]
