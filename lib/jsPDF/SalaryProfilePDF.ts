import { formatCurrency } from "../pdf-utils"
import { Player, Staff } from "../types/team-management"
import { SalaryPayment } from "../types/financial-management"
import { associationAPI } from "../api/association-api"
import { DEFAULT_CLUB_INFO, PDFGenerator } from "./pdf-export-utils"

interface SalaryProfileProps {
    payment: SalaryPayment
    players: Player[]
    staff: Staff[]
}

export async function GenerateSalaryProfilePDF({ payment, players, staff }: SalaryProfileProps){
    const clubInfo = await associationAPI.getSettings() || DEFAULT_CLUB_INFO;
    const generator = new PDFGenerator(clubInfo);
    await generator.initialize();

    const doc = generator.getDocument();


    const currentDate = new Date().toLocaleDateString('fr-FR');
    
    // Get recipient info
    const playerInfo = payment.player || (payment.playerId ? players.find((p) => p.id === payment.playerId) : null)
    const staffInfo = payment.staff || (payment.staffId ? staff.find((s) => s.id === payment.staffId) : null)
    const recipientName = playerInfo
      ? `${playerInfo.firstName} ${playerInfo.lastName}`
      : staffInfo
        ? `${staffInfo.firstName} ${staffInfo.lastName}`
        : "Inconnu"
    const recipientType = playerInfo ? "Joueur" : staffInfo ? "Staff" : "Inconnu"
    const recipientRole = playerInfo?.position || staffInfo?.role || "N/A"

    // Add header using PDFGenerator utility
    await generator.createHeader(
        'Fiche de paiement de salaire',
        String(payment.id),
        currentDate
    );

    // Reset text color to black for the document body
    doc.setTextColor(0, 0, 0);

    let yPos = 60

    // Payment ID and Date section
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text("INFORMATIONS GÉNÉRALES", 20, yPos)
    yPos += 10

    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text(`ID Paiement: ${payment.id}`, 20, yPos)
    doc.text(`Date de paiement: ${new Date(payment.paymentDate).toLocaleDateString("fr-FR")}`, 120, yPos)
    yPos += 8

    doc.text(`Statut: ${payment.status === "PAID" ? "Payé" : "En attente"}`, 20, yPos)
    doc.text(
      `Période: ${new Date(payment.periodStart).toLocaleDateString("fr-FR")} - ${new Date(payment.periodEnd).toLocaleDateString("fr-FR")}`,
      120,
      yPos,
    )
    yPos += 20

    // Recipient Information
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text("BÉNÉFICIAIRE", 20, yPos)
    yPos += 10

    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text(`Nom complet: ${recipientName}`, 20, yPos)
    doc.text(`Type: ${recipientType}`, 120, yPos)
    yPos += 8
    doc.text(`Poste/Rôle: ${recipientRole}`, 20, yPos)
    yPos += 20

    // Financial Details
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text("DÉTAILS FINANCIERS", 20, yPos)
    yPos += 10

    // Create a table-like structure for financial details
    doc.setFillColor(245, 245, 245)
    doc.rect(20, yPos, 170, 40, "F")

    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    yPos += 8

    doc.text("Montant brut:", 25, yPos)
    doc.text(formatCurrency(payment.amount), 80, yPos)

    if (payment.bonus && payment.bonus > 0) {
      yPos += 8
      doc.text("Prime/Bonus:", 25, yPos)
      doc.text(formatCurrency(payment.bonus), 80, yPos)
    }

    if (payment.taxAmount && payment.taxAmount > 0) {
      yPos += 8
      doc.text("Montant des taxes:", 25, yPos)
      doc.text(formatCurrency(payment.taxAmount), 80, yPos)
    }

    // Net amount - highlighted
    yPos += 12
    doc.setFont("helvetica", "bold")
    doc.setFontSize(12)
    doc.text("MONTANT NET:", 25, yPos)
    doc.text(
      formatCurrency(Number(payment.amount) + Number(payment.bonus || 0)),
      80,
      yPos,
    )

    yPos += 25

    // Notes section if available
    if (payment.notes) {
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text("NOTES", 20, yPos)
      yPos += 10

      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      const splitNotes = doc.splitTextToSize(payment.notes, 170)
      doc.text(splitNotes, 20, yPos)
      yPos += splitNotes.length * 5 + 10
    }

    // Add footer using PDFGenerator utility (without signatures)
    generator.addFooter(`FICHE-PAIEMENT-${payment.id}-${new Date().toISOString().split("T")[0]}`);

    // Save the PDF
    const fileName = `fiche-paiement-${payment.id}-${recipientName.replace(/\s+/g, "-")}.pdf`
    doc.save(fileName)
}