import { InventoryItem, InventoryHistory } from "@/lib/redux/InventorySlice"
import { DEFAULT_CLUB_INFO, PDFGenerator } from "./pdf-export-utils"

// Function to get category display name
function getCategoryDisplayName(category: string): string {
  const categoryNames: Record<string, string> = {
    "IT_EQUIPMENT": "Équipement IT",
    "FURNITURE": "Mobilier",
    "VEHICLE": "Véhicule",
    "SPORTS_EQUIPMENT": "Équipement Sportif",
    "ELECTRONICS": "Électronique",
    "OTHER": "Autre",
  }
  return categoryNames[category] || category.replace('_', ' ')
}

// Function to get status display name
function getStatusDisplayName(status: string): string {
  const statusNames: Record<string, string> = {
    "Pending": "En attente",
    "Approved": "Approuvé",
    "Rejected": "Rejeté",
    "In Use": "En utilisation",
    "Returned": "Retourné",
    "Cancelled": "Annulé",
  }
  return statusNames[status] || status
}

// Generate PDF for a single inventory item
export async function generateInventoryItemPDF(item: InventoryItem, clubInfo?: any) {
  const finalClubInfo = clubInfo || DEFAULT_CLUB_INFO
  const generator = new PDFGenerator(finalClubInfo)
  await generator.initialize()

  const doc = generator.getDocument()
  const currentDate = new Date().toLocaleDateString("fr-FR")

  // Add header using PDFGenerator
  await generator.createHeader(
    "Fiche Inventaire - Équipement",
    String(item.id),
    currentDate
  )

  // Reset text color for content
  doc.setTextColor(0, 0, 0)

  let yPosition = 85 // Adjusted from 55 to 85 to account for top padding

  // General Information Section
  doc.setFillColor(248, 250, 252)
  doc.rect(20, yPosition - 5, 170, 8, 'F')
  
  doc.setTextColor(30, 64, 175)
  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  doc.text("INFORMATIONS GÉNÉRALE", 22, yPosition)
  yPosition += 15

  const generalInfo: Array<[string, string]> = [
    ["ID:", item.id.toString()],
    ["Nom:", item.name],
    ["Code:", item.code.toString()],
    ["Catégorie:", getCategoryDisplayName(item.category)],
    ["Unité:", item.unit],
    ["Emplacement:", item.location || "Non spécifié"],
    ["Statut:", item.isActive ? "Actif" : "Inactif"],
    ["Fournisseur:", item.supplier || "Non spécifié"],
  ]

  doc.setTextColor(0, 0, 0)
  doc.setFontSize(9)
  generalInfo.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold")
    doc.text(label, 25, yPosition)
    doc.setFont("helvetica", "normal")
    doc.text(value, 85, yPosition)
    yPosition += 8
  })

  yPosition += 15

  // Description Section
  if (item.description) {
    doc.setFillColor(248, 250, 252)
    doc.rect(20, yPosition - 5, 170, 8, 'F')
    
    doc.setTextColor(30, 64, 175)
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.text("DESCRIPTION", 22, yPosition)
    yPosition += 15

    doc.setTextColor(0, 0, 0)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    const splitDescription = doc.splitTextToSize(item.description, 160)
    doc.text(splitDescription, 25, yPosition)
    yPosition += splitDescription.length * 5 + 15
  }

  // Current Allocations Section
  const currentAllocations = Array.isArray(item.inUserAllocation) ? item.inUserAllocation : []
  if (currentAllocations.length > 0) {
    doc.setFillColor(248, 250, 252)
    doc.rect(20, yPosition - 5, 170, 8, 'F')
    
    doc.setTextColor(30, 64, 175)
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.text(`ALLOCATIONS ACTUELLES (${currentAllocations.length})`, 22, yPosition)
    yPosition += 15

    doc.setTextColor(0, 0, 0)
    doc.setFontSize(9)
    
    currentAllocations.forEach((allocation: InventoryHistory) => {
      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage()
        yPosition = 85 // Adjusted from 20 to 85 for top padding
      }

      const allocationInfo: Array<[string, string]> = [
        ["Référence:", allocation.reference],
        ["Entité:", allocation.entityName || allocation.user || "Non spécifié"],
        ["Type d'allocation:", allocation.allocationType],
        ["Durée:", allocation.allocationDuration || "Non spécifiée"],
        ["Statut:", getStatusDisplayName(allocation.status)],
        ["Date d'allocation:", new Date(allocation.allocatedAt).toLocaleDateString("fr-FR")],
      ]

      // Add a subtle border for each allocation
      doc.setDrawColor(200, 200, 200)
      doc.rect(25, yPosition - 5, 160, allocationInfo.length * 8 + 5)

      allocationInfo.forEach(([label, value]) => {
        doc.setFont("helvetica", "bold")
        doc.text(label, 30, yPosition)
        doc.setFont("helvetica", "normal")
        doc.text(value, 100, yPosition)
        yPosition += 8
      })

      if (allocation.notes) {
        doc.setFont("helvetica", "italic")
        doc.text("Notes:", 30, yPosition)
        const splitNotes = doc.splitTextToSize(allocation.notes, 100)
        doc.text(splitNotes, 100, yPosition)
        yPosition += splitNotes.length * 5
      }

      yPosition += 10
    })
  }

  // Allocation History Section
  const allocationHistory = Array.isArray(item.allocationHistory) ? item.allocationHistory : []
  if (allocationHistory.length > 0) {
    // Check if we need a new page
    if (yPosition > 200) {
      doc.addPage()
      yPosition = 85 // Adjusted from 20 to 85 for top padding
    }

    doc.setFillColor(248, 250, 252)
    doc.rect(20, yPosition - 5, 170, 8, 'F')
    
    doc.setTextColor(30, 64, 175)
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.text(`HISTORIQUE DES ALLOCATIONS (${allocationHistory.length})`, 22, yPosition)
    yPosition += 15

    doc.setTextColor(0, 0, 0)
    doc.setFontSize(9) // Slightly smaller for history

    // Show last 5 allocations to avoid overly long PDFs
    const recentHistory = allocationHistory.slice(0, 5)
    
    recentHistory.forEach((allocation: InventoryHistory) => {
      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage()
        yPosition = 85 // Adjusted from 20 to 85 for top padding
      }

      const historyInfo: Array<[string, string]> = [
        ["Référence:", allocation.reference],
        ["Entité:", allocation.entityName || allocation.user || "Non spécifié"],
        ["Type:", allocation.allocationType],
        ["Statut:", getStatusDisplayName(allocation.status)],
        ["Alloué le:", new Date(allocation.allocatedAt).toLocaleDateString("fr-FR")],
      ]

      if (allocation.returnedAt) {
        historyInfo.push(["Retourné le:", new Date(allocation.returnedAt).toLocaleDateString("fr-FR")])
      }

      // Add a subtle border for each history item
      doc.setDrawColor(220, 220, 220)
      doc.rect(25, yPosition - 3, 160, historyInfo.length * 6 + 3)

      historyInfo.forEach(([label, value]) => {
        doc.setFont("helvetica", "bold")
        doc.text(label, 30, yPosition)
        doc.setFont("helvetica", "normal")
        doc.text(value, 90, yPosition)
        yPosition += 6
      })

      yPosition += 8
    })

    if (allocationHistory.length > 5) {
      doc.setFont("helvetica", "italic")
      doc.setTextColor(100, 100, 100)
      doc.text(`... et ${allocationHistory.length - 5} autre(s) allocation(s)`, 30, yPosition)
      yPosition += 10
    }
  }

  // Statistics Section
  yPosition += 10

  doc.setFillColor(248, 250, 252)
  doc.rect(20, yPosition - 5, 170, 8, 'F')
  
  doc.setTextColor(30, 64, 175)
  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")

  // Ensure enough space before adding footer
  const pageHeight = doc.internal.pageSize.height;
  if (yPosition > pageHeight - 80) {
    doc.addPage();
    yPosition = 20;
  }
  generator.addFooter(`FICHE-INVENTAIRE-${item.id}-${new Date().toISOString().split("T")[0]}`)

  // Save the PDF
  const fileName = `fiche-inventaire-${item.id}-${item.name.replace(/\s+/g, "-")}.pdf`
  doc.save(fileName)
}

// Generate PDF for multiple inventory items (summary report)
export async function generateInventoryReportPDF(items: InventoryItem[], clubInfo?: any) {
  const finalClubInfo = clubInfo || DEFAULT_CLUB_INFO
  const generator = new PDFGenerator(finalClubInfo)
  await generator.initialize()

  const doc = generator.getDocument()
  const currentDate = new Date().toLocaleDateString("fr-FR")

  // Add header using PDFGenerator
  await generator.createHeader(
    "Rapport d'Inventaire",
    `RAPPORT-${new Date().toISOString().split("T")[0]}`,
    currentDate
  )

  // Reset text color for content
  doc.setTextColor(0, 0, 0)

  let yPosition = 85 // Adjusted from 55 to 85 to account for top padding

  // Summary Statistics
  const totalItems = items.length
  const activeItems = items.filter(item => item.isActive).length
  const allocatedItems = items.filter(item => 
    (Array.isArray(item.inUserAllocation) && item.inUserAllocation.length > 0) ||
    (Array.isArray(item.allocationHistory) && item.allocationHistory.some(h => h.status === 'In Use'))
  ).length

  doc.setFillColor(248, 250, 252)
  doc.rect(20, yPosition - 5, 170, 8, 'F')
  
  doc.setTextColor(30, 64, 175)
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.text("RÉSUMÉ EXÉCUTIF", 22, yPosition)
  yPosition += 15

  const summaryStats: Array<[string, string]> = [
    ["Total des équipements:", totalItems.toString()],
    ["Équipements actifs:", `${activeItems} (${((activeItems/totalItems)*100).toFixed(1)}%)`],
    ["Équipements alloués:", `${allocatedItems} (${((allocatedItems/totalItems)*100).toFixed(1)}%)`],
    ["Date du rapport:", currentDate],
  ]

  doc.setTextColor(0, 0, 0)
  doc.setFontSize(9)
  summaryStats.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold")
    doc.text(label, 25, yPosition)
    doc.setFont("helvetica", "normal")
    doc.text(value, 100, yPosition)
    yPosition += 10
  })

  yPosition += 15

  // Categories breakdown
  const categories = Array.from(new Set(items.map(item => item.category)))
  
  doc.setFillColor(248, 250, 252)
  doc.rect(20, yPosition - 5, 170, 8, 'F')
  
  doc.setTextColor(30, 64, 175)
  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  doc.text("RÉPARTITION PAR CATÉGORIE", 22, yPosition)
  yPosition += 15

  doc.setTextColor(0, 0, 0)
  doc.setFontSize(9)
  categories.forEach(category => {
    const categoryItems = items.filter(item => item.category === category)
    doc.setFont("helvetica", "bold")
    doc.text(getCategoryDisplayName(category), 25, yPosition)
    doc.setFont("helvetica", "normal")
    doc.text(`${categoryItems.length} équipement(s)`, 100, yPosition)
    yPosition += 8
  })

  yPosition += 15

  // Items list (condensed)
  doc.setFillColor(248, 250, 252)
  doc.rect(20, yPosition - 5, 170, 8, 'F')
  
  doc.setTextColor(30, 64, 175)
  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  doc.text("LISTE DES ÉQUIPEMENTS", 22, yPosition)
  yPosition += 15

  // Table headers
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  doc.text("Code", 25, yPosition)
  doc.text("Nom", 45, yPosition)
  doc.text("Catégorie", 90, yPosition)
  doc.text("Emplacement", 125, yPosition)
  doc.text("Statut", 165, yPosition)
  yPosition += 8

  // Draw header line
  doc.setDrawColor(0, 0, 0)
  doc.line(20, yPosition - 2, 190, yPosition - 2)
  yPosition += 3

  doc.setFont("helvetica", "normal")
  items.forEach((item) => {
    // Check if we need a new page
    if (yPosition > 270) {
      doc.addPage()
      yPosition = 85 // Adjusted from 20 to 85 for top padding
      
      // Redraw headers on new page
      doc.setFont("helvetica", "bold")
      doc.text("Code", 25, yPosition)
      doc.text("Nom", 45, yPosition)
      doc.text("Catégorie", 90, yPosition)
      doc.text("Emplacement", 125, yPosition)
      doc.text("Statut", 165, yPosition)
      yPosition += 8
      doc.line(20, yPosition - 2, 190, yPosition - 2)
      yPosition += 3
      doc.setFont("helvetica", "normal")
    }

    doc.text(item.code.toString(), 25, yPosition)
    doc.text(item.name.substring(0, 15) + (item.name.length > 15 ? '...' : ''), 45, yPosition)
    doc.text(getCategoryDisplayName(item.category).substring(0, 10), 90, yPosition)
    doc.text((item.location || 'N/A').substring(0, 12), 125, yPosition)
    doc.text(item.isActive ? 'Actif' : 'Inactif', 165, yPosition)
    yPosition += 6
  })

  // Ensure enough space before adding footer
  const pageHeight = doc.internal.pageSize.height;
  if (yPosition > pageHeight - 80) {
    doc.addPage();
    yPosition = 20;
  }
  generator.addFooter(`RAPPORT-INVENTAIRE-${new Date().toISOString().split("T")[0]}`)

  // Save the PDF
  const fileName = `rapport-inventaire-${new Date().toISOString().split("T")[0]}.pdf`
  doc.save(fileName)
}

// Export utility function to generate PDF for filtered items
export async function generateFilteredInventoryPDF(
  items: InventoryItem[], 
  filters: {
    search?: string,
    category?: string,
    location?: string,
    status?: string
  },
  clubInfo?: any
) {
  const filteredItems = items.filter(item => {
    const matchesSearch = !filters.search || 
      item.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      item.code.toString().includes(filters.search);
    
    const matchesCategory = !filters.category || filters.category === 'all' || 
      item.category === filters.category;
    
    const matchesLocation = !filters.location || filters.location === 'all' || 
      item.location === filters.location;
    
    const matchesStatus = !filters.status || filters.status === 'all' ||
      (filters.status === 'active' ? item.isActive : !item.isActive);

    return matchesSearch && matchesCategory && matchesLocation && matchesStatus;
  });

  await generateInventoryReportPDF(filteredItems, clubInfo);
}