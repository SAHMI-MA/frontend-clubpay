// Association Settings API
export interface AssociationSettings {
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

const API_BASE_URL = 'http://localhost:8080/api'

class AssociationAPIService {
  private baseURL = API_BASE_URL
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
    formData.append('logo', file)
    
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
