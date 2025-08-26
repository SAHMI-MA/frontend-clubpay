import { calculateAge } from "../utils/date-utils"
import { Staff } from "../types/team-management"
import { associationAPI } from "../api/association-api"
import { DEFAULT_CLUB_INFO, PDFGenerator } from "./pdf-export-utils"

interface StaffProfilePDFProps{
    staff: Staff,
    teamName: string
}

export default async function StaffProfilePDF({staff, teamName}: StaffProfilePDFProps) {
    const clubInfo = await associationAPI.getSettings() || DEFAULT_CLUB_INFO;
    const generator = new PDFGenerator(clubInfo);
    await generator.initialize();

    const doc = generator.getDocument();

    const currentDate = new Date().toLocaleDateString('fr-FR');

    // Add header using PDFGenerator utility
    await generator.createHeader(
        'Fiche membre du staff',
        String(staff.id),
        currentDate
    );

    // Reset text color to black for the document body
    doc.setTextColor(0, 0, 0);

    let yPosition = 85 // Adjusted from 55 to 85 to account for top padding

    // Staff member name and role
    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")
    doc.text(`${staff.firstName} ${staff.lastName}`, 20, yPosition)

    // Role badge
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.setFillColor(59, 130, 246) // Blue background for role
    doc.setTextColor(255, 255, 255)
    doc.rect(20, yPosition + 5, doc.getTextWidth(staff.role) + 6, 8, "F")
    doc.text(staff.role, 23, yPosition + 11)

    yPosition += 25
    doc.setTextColor(0, 0, 0)

    // General Information Section
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text("INFORMATIONS GÉNÉRALES", 20, yPosition)
    yPosition += 10

    // Create a table-like structure for general info
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")

    const generalInfo = [
      ["ID Staff:", staff.id.toString()],
      ["Équipe:", teamName],
      ["Date de naissance:", new Date(staff.dateOfBirth).toLocaleDateString("fr-FR")],
      ["Âge:", `${calculateAge(staff.dateOfBirth)} ans`],
      ["CIN/Passeport:", staff.cin || "Non spécifié"],
      ["Nationalité:", staff.nationality || "Non spécifiée"],
    ]

    generalInfo.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold")
      doc.text(label, 20, yPosition)
      doc.setFont("helvetica", "normal")
      doc.text(value, 80, yPosition)
      yPosition += 8
    })

    yPosition += 10

    // Contact Information Section
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text("INFORMATIONS DE CONTACT", 20, yPosition)
    yPosition += 10

    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")

    const contactInfo = [
      ["Téléphone:", staff.phoneNumber || "Non spécifié"],
      ["Email:", staff.email || "Non spécifié"],
    ]

    contactInfo.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold")
      doc.text(label, 20, yPosition)
      doc.setFont("helvetica", "normal")
      doc.text(value, 80, yPosition)
      yPosition += 8
    })

    yPosition += 10

    // Professional Information Section
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text("INFORMATIONS PROFESSIONNELLES", 20, yPosition)
    yPosition += 10

    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")

    const professionalInfo = [
      ["Qualification:", staff.qualification || "Non spécifiée"],
      ["RIB:", staff.rib || "Non spécifié"],
    ]

    professionalInfo.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold")
      doc.text(label, 20, yPosition)
      doc.setFont("helvetica", "normal")
      doc.text(value, 80, yPosition)
      yPosition += 8
    })

    // Experience section (if available)
    if (staff.experience) {
      yPosition += 5
      doc.setFont("helvetica", "bold")
      doc.text("Expérience:", 20, yPosition)
      yPosition += 8

      doc.setFont("helvetica", "normal")
      // Split long experience text into multiple lines
      const experienceLines = doc.splitTextToSize(staff.experience, 170)
      experienceLines.forEach((line: string) => {
        doc.text(line, 20, yPosition)
        yPosition += 6
      })
    }

    // Add footer using PDFGenerator utility (without signatures)
    generator.addFooter(`FICHE-STAFF-${staff.id}-${new Date().toISOString().split("T")[0]}`);

    // Save the PDF
    const fileName = `fiche-staff-${staff.id}-${staff.firstName}-${staff.lastName}.pdf`
    doc.save(fileName)
}