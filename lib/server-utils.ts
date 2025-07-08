// Server-side utility to fetch association settings
// This runs on the server and doesn't have access to localStorage
// Used for generating dynamic metadata in the layout component

/**
 * To use a system token for fetching association settings on the server:
 * Add SYSTEM_API_TOKEN to your .env.local file:
 * SYSTEM_API_TOKEN=your_backend_system_token_here
 * 
 * This allows the server to fetch association data even when no user is logged in,
 * which is necessary for generating proper SEO metadata.
 */

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

export async function getAssociationSettings(): Promise<AssociationSettings | null> {
  try {
    // For server-side requests, we'll use a direct API call
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'
    
    // Try without auth first (for public metadata)
    let response = await fetch(`${baseUrl}/associations/settings`, {
      headers: {
        'Content-Type': 'application/json',
      },
      // Add cache control for better performance
      next: { revalidate: 300 }, // Revalidate every 5 minutes
      // Add timeout to prevent hanging during build
      signal: AbortSignal.timeout(5000) // 5 second timeout
    })

    // If unauthorized, try with a system token if available
    if (response.status === 401 && process.env.SYSTEM_API_TOKEN) {
      response = await fetch(`${baseUrl}/associations/settings`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SYSTEM_API_TOKEN}`
        },
        next: { revalidate: 300 },
        signal: AbortSignal.timeout(5000)
      })
    }

    if (!response.ok) {
      console.warn('Failed to fetch association settings for metadata:', response.status)
      return null
    }

    return await response.json()
  } catch (error) {
    console.warn('Error fetching association settings for metadata:', error)
    return null
  }
}

export function getDefaultMetadata() {
  return {
    title: "Sports Manager",
    description: "Comprehensive sports association management system"
  }
}

export async function getAssociationMetadata() {
  const settings = await getAssociationSettings()
  
  if (settings) {
    const title = settings.name ? `${settings.name} - Sports Manager` : "Sports Manager"
    const description = settings.description || 
                       (settings.tagline ? `${settings.tagline} - Comprehensive sports association management system` : "Comprehensive sports association management system")
    
    return {
      title,
      description,
      siteName: settings.name || "Sports Manager",
      organizationName: settings.name,
      contactEmail: settings.contactEmail,
      address: settings.address
    }
  }
  
  return {
    ...getDefaultMetadata(),
    siteName: "Sports Manager",
    organizationName: null,
    contactEmail: null,
    address: null
  }
}
