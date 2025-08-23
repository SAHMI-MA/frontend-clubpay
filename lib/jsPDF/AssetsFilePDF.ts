import { Asset } from "../api/AssetsAPI"
import { associationAPI } from "../api/association-api"
import { DEFAULT_CLUB_INFO, PDFGenerator } from "./pdf-export-utils"

export default async function generateAssetPDF(asset: Asset) {
  const clubInfo = await associationAPI.getSettings() || DEFAULT_CLUB_INFO
  const generator = new PDFGenerator(clubInfo)
  await generator.initialize()

  const doc = generator.getDocument()
  const currentDate = new Date().toLocaleDateString("fr-FR")

  // Add header using PDFGenerator
  await generator.createHeader(
    "Fiche inventaire - Bien",
    String(asset.id),
    currentDate
  )

  // Reset text color for content
  doc.setTextColor(0, 0, 0)

  let yPosition = 55

  // General Information Section
  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.text("INFORMATIONS GÉNÉRALES", 20, yPosition)
  yPosition += 10

  const generalInfo: Array<[string, string]> = [
    ["ID:", asset.id.toString()],
    ["Nom:", asset.name],
    ["Référence:", asset.reference],
    ["Catégorie:", asset.category],
    ["Emplacement:", asset.location],
    ["État:", asset.condition],
  ]

  doc.setFontSize(10)
  generalInfo.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold")
    doc.text(label, 20, yPosition)
    doc.setFont("helvetica", "normal")
    doc.text(value || "Non spécifié", 80, yPosition)
    yPosition += 8
  })

  yPosition += 10

  // Financial Information Section
  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.text("INFORMATIONS FINANCIÈRES", 20, yPosition)
  yPosition += 10

  const financialInfo: Array<[string, string]> = [
    ["Date d'achat:", new Date(asset.purchaseDate).toLocaleDateString("fr-FR")],
    ["Prix d'achat:", asset.purchasePrice ? `${asset.purchasePrice.toLocaleString()} MAD` : "Non spécifié"],
    ["Valeur actuelle:", asset.currentValue ? `${asset.currentValue.toLocaleString()} MAD` : "Non évaluée"],
    ["Fournisseur:", asset.supplier || "Non spécifié"],
  ]

  doc.setFontSize(10)
  financialInfo.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold")
    doc.text(label, 20, yPosition)
    doc.setFont("helvetica", "normal")
    doc.text(value, 80, yPosition)
    yPosition += 8
  })

  yPosition += 10

  // Technical Information Section
  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.text("INFORMATIONS TECHNIQUES", 20, yPosition)
  yPosition += 10

  const technicalInfo: Array<[string, string]> = [
    ["N° de série:", asset.serialNumber || "Non spécifié"],
    ["Fin de garantie:", asset.warrantyEndDate ? new Date(asset.warrantyEndDate).toLocaleDateString("fr-FR") : "Non spécifiée"],
    ["Dernière maintenance:", asset.maintenanceDate ? new Date(asset.maintenanceDate).toLocaleDateString("fr-FR") : "Aucune"],
    ["Statut:", asset.isActive ? "Actif" : "Inactif"],
  ]

  doc.setFontSize(10)
  technicalInfo.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold")
    doc.text(label, 20, yPosition)
    doc.setFont("helvetica", "normal")
    doc.text(value, 80, yPosition)
    yPosition += 8
  })

  yPosition += 10

  // Description Section
  if (asset.description) {
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text("DESCRIPTION", 20, yPosition)
    yPosition += 10

    doc.setFont("helvetica", "normal")
    const splitDescription = doc.splitTextToSize(asset.description, 170)
    doc.text(splitDescription, 20, yPosition)
    yPosition += splitDescription.length * 5
  }

  // Add footer (with document reference)
  generator.addFooter(`FICHE-BIEN-${asset.id}-${new Date().toISOString().split("T")[0]}`)

  // Save the PDF
  const fileName = `fiche-bien-${asset.id}-${asset.name.replace(/\s+/g, "-")}.pdf`
  doc.save(fileName)
}
