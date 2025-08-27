import { formatCurrency } from "../pdf-utils"
import { formatDate } from "../utils/date-utils"
import { Employee } from "../api/hr-api"
import { associationAPI } from "../api/association-api"
import { DEFAULT_CLUB_INFO, PDFGenerator } from "./pdf-export-utils"


export async function GenerateEmployeeProfilePDF(employee: Employee) {
    const clubInfo = await associationAPI.getSettings() || DEFAULT_CLUB_INFO;
    const generator = new PDFGenerator(clubInfo);
    await generator.initialize();

    const pdf = generator.getDocument();
    const pageWidth = 210
    const margin = 20
    const contentWidth = pageWidth - margin * 2

    const currentDate = new Date().toLocaleDateString('fr-FR');

    // Add header using PDFGenerator utility
    await generator.createHeader(
        'Fiche employé',
        employee.employeeId,
        currentDate
    );

    let yPosition = 85 // Adjusted from 60 to 85 to account for top padding

    // Employee basic info section
    pdf.setTextColor(0, 0, 0)
    pdf.setFontSize(16)
    pdf.setFont("helvetica", "bold")
    pdf.text("INFORMATIONS PERSONNELLES", margin, yPosition)
    yPosition += 10

    // Draw a line under the section title
    pdf.setDrawColor(200, 200, 200)
    pdf.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 15

    pdf.setFontSize(11)
    pdf.setFont("helvetica", "normal")

    // Personal information in two columns
    const leftColumn = margin
    const rightColumn = margin + contentWidth / 2

    // Left column
    pdf.setFont("helvetica", "bold")
    pdf.text("Nom complet:", leftColumn, yPosition)
    pdf.setFont("helvetica", "normal")
    pdf.text(`${employee.fullName || "N/A"}`, leftColumn + 30, yPosition)

    pdf.setFont("helvetica", "bold")
    pdf.text("ID Employé:", rightColumn, yPosition)
    pdf.setFont("helvetica", "normal")
    pdf.text(employee.employeeId, rightColumn + 30, yPosition)
    yPosition += 8

    if (employee.dateOfBirth) {
        pdf.setFont("helvetica", "bold")
        pdf.text("Date de naissance:", leftColumn, yPosition)
        pdf.setFont("helvetica", "normal")
        pdf.text(formatDate(employee.dateOfBirth), leftColumn + 40, yPosition)
    }

    if (employee.nationality) {
        pdf.setFont("helvetica", "bold")
        pdf.text("Nationalité:", rightColumn, yPosition)
        pdf.setFont("helvetica", "normal")
        pdf.text(employee.nationality, rightColumn + 30, yPosition)
    }
    yPosition += 8

    if (employee.nationalId) {
        pdf.setFont("helvetica", "bold")
        pdf.text("CIN/Passeport:", leftColumn, yPosition)
        pdf.setFont("helvetica", "normal")
        pdf.text(employee.nationalId, leftColumn + 35, yPosition)
    }

    if (employee.maritalStatus) {
        pdf.setFont("helvetica", "bold")
        pdf.text("Situation familiale:", rightColumn, yPosition)
        pdf.setFont("helvetica", "normal")
        pdf.text(employee.maritalStatus, rightColumn + 40, yPosition)
    }
    yPosition += 20

    // Contact information section
    pdf.setFontSize(16)
    pdf.setFont("helvetica", "bold")
    pdf.text("CONTACT & ADRESSE", margin, yPosition)
    yPosition += 10

    pdf.setDrawColor(200, 200, 200)
    pdf.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 15

    pdf.setFontSize(11)
    pdf.setFont("helvetica", "normal")

    if (employee.phoneNumber) {
        pdf.setFont("helvetica", "bold")
        pdf.text("Téléphone:", leftColumn, yPosition)
        pdf.setFont("helvetica", "normal")
        pdf.text(employee.phoneNumber, leftColumn + 25, yPosition)
    }

    if (employee.personalEmail) {
        pdf.setFont("helvetica", "bold")
        pdf.text("Email personnel:", rightColumn, yPosition)
        pdf.setFont("helvetica", "normal")
        pdf.text(employee.personalEmail, rightColumn + 35, yPosition)
    }
    yPosition += 8

    if (employee.address) {
        pdf.setFont("helvetica", "bold")
        pdf.text("Adresse:", leftColumn, yPosition)
        pdf.setFont("helvetica", "normal")
        const addressLines = pdf.splitTextToSize(employee.address, contentWidth - 25)
        pdf.text(addressLines, leftColumn + 25, yPosition)
        yPosition += addressLines.length * 5
    }
    yPosition += 15

    // Professional information section
    if (yPosition > 200) {
        pdf.addPage()
        yPosition = 85 // Adjusted from 30 to 85 for top padding
    }

    pdf.setFontSize(16)
    pdf.setFont("helvetica", "bold")
    pdf.text("INFORMATIONS PROFESSIONNELLES", margin, yPosition)
    yPosition += 10

    pdf.setDrawColor(200, 200, 200)
    pdf.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 15

    pdf.setFontSize(11)
    pdf.setFont("helvetica", "normal")

    pdf.setFont("helvetica", "bold")
    pdf.text("Département:", leftColumn, yPosition)
    pdf.setFont("helvetica", "normal")
    pdf.text(employee.department?.name || "Non assigné", leftColumn + 30, yPosition)

    pdf.setFont("helvetica", "bold")
    pdf.text("Poste:", rightColumn, yPosition)
    pdf.setFont("helvetica", "normal")
    pdf.text(employee.position?.title || "Non assigné", rightColumn + 20, yPosition)
    yPosition += 8

    if (employee.hireDate) {
        pdf.setFont("helvetica", "bold")
        pdf.text("Date d'embauche:", leftColumn, yPosition)
        pdf.setFont("helvetica", "normal")
        pdf.text(formatDate(employee.hireDate), leftColumn + 40, yPosition)
    }

    pdf.setFont("helvetica", "bold")
    pdf.text("Statut:", rightColumn, yPosition)
    pdf.setFont("helvetica", "normal")
    pdf.text(employee.status || "Actif", rightColumn + 20, yPosition)
    yPosition += 8

    if (employee.currentSalary) {
        pdf.setFont("helvetica", "bold")
        pdf.text("Salaire actuel:", leftColumn, yPosition)
        pdf.setFont("helvetica", "normal")
        pdf.text(formatCurrency(Number(employee.currentSalary)), leftColumn + 35, yPosition)
    }
    yPosition += 20

    // Financial information section
    if (yPosition > 220) {
        pdf.addPage()
        yPosition = 85 // Adjusted from 30 to 85 for top padding
    }

    pdf.setFontSize(16)
    pdf.setFont("helvetica", "bold")
    pdf.text("INFORMATIONS FINANCIÈRES", margin, yPosition)
    yPosition += 10

    pdf.setDrawColor(200, 200, 200)
    pdf.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 15

    pdf.setFontSize(11)
    pdf.setFont("helvetica", "normal")

    if (employee.currentSalary) {
        pdf.setFont("helvetica", "bold")
        pdf.text("Salaire mensuel:", leftColumn, yPosition)
        pdf.setFont("helvetica", "normal")
        pdf.text(formatCurrency(Number(employee.currentSalary)), leftColumn + 35, yPosition)

        pdf.setFont("helvetica", "bold")
        pdf.text("Salaire annuel estimé:", rightColumn, yPosition)
        pdf.setFont("helvetica", "normal")
        pdf.text(formatCurrency(Number.parseFloat(employee.currentSalary || "0") * 12), rightColumn + 45, yPosition)
        yPosition += 8
    }

    if (employee.bankAccountNumber) {
        pdf.setFont("helvetica", "bold")
        pdf.text("Compte bancaire:", leftColumn, yPosition)
        pdf.setFont("helvetica", "normal")
        pdf.text(employee.bankAccountNumber, leftColumn + 35, yPosition)
    }

    if (employee.bankName) {
        pdf.setFont("helvetica", "bold")
        pdf.text("Banque:", rightColumn, yPosition)
        pdf.setFont("helvetica", "normal")
        pdf.text(employee.bankName, rightColumn + 20, yPosition)
    }
    yPosition += 15

    // Notes section
    if (employee.notes && yPosition < 250) {
        pdf.setFontSize(16)
        pdf.setFont("helvetica", "bold")
        pdf.text("NOTES", margin, yPosition)
        yPosition += 10

        pdf.setDrawColor(200, 200, 200)
        pdf.line(margin, yPosition, pageWidth - margin, yPosition)
        yPosition += 10

        pdf.setFontSize(11)
        pdf.setFont("helvetica", "normal")
        const notesLines = pdf.splitTextToSize(employee.notes, contentWidth)
        pdf.text(notesLines, margin, yPosition)
        yPosition += notesLines.length * 5
    }

    // FIXED: Ensure enough space before adding footer (same as inventory PDF)
    const pageHeight = pdf.internal.pageSize.height;
    if (yPosition > pageHeight - 80) {
        pdf.addPage();
        yPosition = 20;
    }

    // Add footer using PDFGenerator utility (without signatures)
    generator.addFooter(`FICHE-EMPLOYE-${employee.employeeId}-${new Date().toISOString().split("T")[0]}`);

    // Save the PDF
    pdf.save(
        `Fiche_Employe_${employee.fullName?.replace(/\s+/g, "_") || "Unknown"}_${new Date().toISOString().split("T")[0]}.pdf`,
    )
}