import { formatCurrency } from "../pdf-utils"
import { SalaryPayment } from "../api/hr-salary-api"
import { associationAPI } from "../api/association-api"
import { DEFAULT_CLUB_INFO, PDFGenerator } from "./pdf-export-utils"

interface EmployeeSalaryPdfProps{
    payment: SalaryPayment;
    bankAccounts: { id: string; bankName: string; accountNumber: string }[];
}

export async function generateEmployeeSalaryPDF({ payment, bankAccounts }: EmployeeSalaryPdfProps) {
    const clubInfo = await associationAPI.getSettings() || DEFAULT_CLUB_INFO;
    const generator = new PDFGenerator(clubInfo);
    await generator.initialize();

    const doc = generator.getDocument();


    const currentDate = new Date().toLocaleDateString('fr-FR');

    // Get employee info
    const employeeName = payment.employee?.fullName|| payment.employeeId || "Employé Inconnu"
    const employeeId = payment.employee?.employeeId || payment.employeeId || "N/A"

    // Add header using PDFGenerator utility
    await generator.createHeader(
        'Fiche de paiement de salaire RH',
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
    doc.text(`Date de paiement: ${payment.paymentDate || "N/A"}`, 120, yPos)
    yPos += 8

    doc.text(
      `Statut: ${payment.status === "processed" ? "Traité" : payment.status === "pending" ? "En attente" : payment.status}`,
      20,
      yPos,
    )
    doc.text(`Période: ${payment.payPeriod || "N/A"}`, 120, yPos)
    yPos += 20

    // Employee Information
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text("INFORMATIONS EMPLOYÉ", 20, yPos)
    yPos += 10

    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text(`Nom complet: ${employeeName}`, 20, yPos)
    doc.text(`ID Employé: ${employeeId}`, 120, yPos)
    yPos += 8
    doc.text(`Méthode de paiement: ${payment.paymentMethod || "N/A"}`, 120, yPos)
    yPos += 20

    // Bank Account Information (if applicable)
    if (payment.paymentMethod === "Bank Transfer" && payment.bankAccountId) {
      const bankAccount = bankAccounts.find((a) => a.id === String(payment.bankAccountId))
      if (bankAccount) {
        doc.setFontSize(12)
        doc.setFont("helvetica", "bold")
        doc.text("COMPTE BANCAIRE", 20, yPos)
        yPos += 8

        doc.setFontSize(10)
        doc.setFont("helvetica", "normal")
        doc.text(`Banque: ${bankAccount.bankName}`, 20, yPos)
        doc.text(`Numéro de compte: ${bankAccount.accountNumber}`, 120, yPos)
        yPos += 15
      }
    }

    // Financial Details
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text("DÉTAILS FINANCIERS", 20, yPos)
    yPos += 10

    // Create a table-like structure for financial details
    doc.setFillColor(245, 245, 245)
    doc.rect(20, yPos, 170, 50, "F")

    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    yPos += 8

    doc.text("Salaire de base:", 25, yPos)
    doc.text(formatCurrency(Number(payment.baseSalary) || 0), 80, yPos)

    if (payment.overtime && Number(payment.overtime) > 0) {
      yPos += 8
      doc.text("Heures supplémentaires:", 25, yPos)
      doc.text(formatCurrency(Number(payment.overtime)), 80, yPos)
    }

    if (payment.bonuses && Number(payment.bonuses) > 0) {
      yPos += 8
      doc.text("Primes:", 25, yPos)
      doc.text(formatCurrency(Number(payment.bonuses)), 80, yPos)
    }

    // Calculate gross pay
    const grossPay = Number(payment.baseSalary || 0) + Number(payment.overtime || 0) + Number(payment.bonuses || 0)
    yPos += 8
    doc.text("Salaire brut:", 25, yPos)
    doc.text(formatCurrency(grossPay), 80, yPos)

    // Net amount - highlighted
    yPos += 12
    doc.setFont("helvetica", "bold")
    doc.setFontSize(12)
    doc.text("MONTANT NET:", 25, yPos)
    doc.text(formatCurrency(Number(payment.amount) || 0), 80, yPos)

    yPos += 25

    // Period details if available
    if (payment.periodStart && payment.periodEnd) {
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.text("PÉRIODE DE TRAVAIL", 20, yPos)
      yPos += 8

      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.text(`Du: ${payment.periodStart}`, 25, yPos)
      doc.text(`Au: ${payment.periodEnd}`, 120, yPos)
      yPos += 15
    }

    // Processing information if available
    if (payment.processedDate) {
      doc.setFontSize(10)
      doc.setFont("helvetica", "italic")
      doc.text(`Traité le: ${payment.processedDate}`, 20, yPos)
      yPos += 10
    }

    // Add footer using PDFGenerator utility (without signatures)
    generator.addFooter(`FICHE-PAIEMENT-RH-${payment.id}-${new Date().toISOString().split("T")[0]}`);

    // Save the PDF
    const fileName = `fiche-paiement-rh-${payment.id}-${employeeName.replace(/\s+/g, "-")}.pdf`
    doc.save(fileName)
}