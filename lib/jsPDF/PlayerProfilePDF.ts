import { Player } from "../types/team-management"
import { calculateAge, formatDate } from "../utils/date-utils"
import { formatCurrency } from "../pdf-utils"
import { associationAPI } from "../api/association-api"
import { DEFAULT_CLUB_INFO, PDFGenerator } from "./pdf-export-utils"

interface PlayerProfilePDFProps {
    player: Player,
    teamName: string,
    position: string
}

export async function generatePlayerProfilePDF(
    {
        player,
        teamName,
        position
    }: PlayerProfilePDFProps): Promise<void> {
    const clubInfo = await associationAPI.getSettings() || DEFAULT_CLUB_INFO;
    const generator = new PDFGenerator(clubInfo);
    await generator.initialize();

    const pdf = generator.getDocument();
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;
    const margin = 20;
    const contentWidth = pageWidth - 2 * margin;
    let yPosition = 85; // Adjusted from 50 to 85 to account for top padding

    const currentDate = new Date().toLocaleDateString('fr-FR');

    // Add header using PDFGenerator utility
    await generator.createHeader(
        'Fiche joueur',
        String(player.id),
        currentDate
    );

    // Player basic info section
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
    pdf.text(`${player.firstName} ${player.lastName}`, leftColumn + 30, yPosition)

    pdf.setFont("helvetica", "bold")
    pdf.text("Date de naissance:", rightColumn, yPosition)
    pdf.setFont("helvetica", "normal")
    pdf.text(formatDate(player.dateOfBirth), rightColumn + 40, yPosition)
    yPosition += 8

    pdf.setFont("helvetica", "bold")
    pdf.text("Âge:", leftColumn, yPosition)
    pdf.setFont("helvetica", "normal")
    pdf.text(`${calculateAge(player.dateOfBirth)} ans`, leftColumn + 30, yPosition)

    if (player.cin) {
        pdf.setFont("helvetica", "bold")
        pdf.text("CIN:", rightColumn, yPosition)
        pdf.setFont("helvetica", "normal")
        pdf.text(player.cin, rightColumn + 40, yPosition)
    }
    yPosition += 8

    if (player.nationality) {
        pdf.setFont("helvetica", "bold")
        pdf.text("Nationalité:", leftColumn, yPosition)
        pdf.setFont("helvetica", "normal")
        pdf.text(player.nationality, leftColumn + 30, yPosition)
    }

    if (player.rib) {
        pdf.setFont("helvetica", "bold")
        pdf.text("RIB:", rightColumn, yPosition)
        pdf.setFont("helvetica", "normal")
        pdf.text(player.rib, rightColumn + 40, yPosition)
    }
    yPosition += 20

    // Sports information section
    pdf.setFontSize(16)
    pdf.setFont("helvetica", "bold")
    pdf.text("INFORMATIONS SPORTIVES", margin, yPosition)
    yPosition += 10

    pdf.setDrawColor(200, 200, 200)
    pdf.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 15

    pdf.setFontSize(11)
    pdf.setFont("helvetica", "normal")

    pdf.setFont("helvetica", "bold")
    pdf.text("Équipe:", leftColumn, yPosition)
    pdf.setFont("helvetica", "normal")
    pdf.text(teamName, leftColumn + 30, yPosition)

    pdf.setFont("helvetica", "bold")
    pdf.text("Position:", rightColumn, yPosition)
    pdf.setFont("helvetica", "normal")
    pdf.text(position, rightColumn + 40, yPosition)
    yPosition += 8

    if (player.playerNumber) {
        pdf.setFont("helvetica", "bold")
        pdf.text("N° Maillot:", leftColumn, yPosition)
        pdf.setFont("helvetica", "normal")
        pdf.text(`#${player.playerNumber}`, leftColumn + 30, yPosition)
    }

    pdf.setFont("helvetica", "bold")
    pdf.text("Statut:", rightColumn, yPosition)
    pdf.setFont("helvetica", "normal")
    const statusText =
        player.playerStatus === "ACTIVE"
            ? "Actif"
            : player.playerStatus === "INJURED"
                ? "Blessé"
                : player.playerStatus === "SUSPENDED"
                    ? "Suspendu"
                    : player.playerStatus === "RETIRED"
                        ? "Retraité"
                        : "Actif"
    pdf.text(statusText, rightColumn + 40, yPosition)
    yPosition += 8

    if (player.playerCode) {
        pdf.setFont("helvetica", "bold")
        pdf.text("Code Joueur:", leftColumn, yPosition)
        pdf.setFont("helvetica", "normal")
        pdf.text(player.playerCode, leftColumn + 30, yPosition)
    }
    yPosition += 20

    // Contract information (if exists)
    if (player.contract) {
        // Check if we need a new page
        if (yPosition > 220) {
            pdf.addPage()
            yPosition = 85 // Adjusted from 30 to 85 for top padding
        }

        pdf.setFontSize(16)
        pdf.setFont("helvetica", "bold")
        pdf.text("INFORMATIONS CONTRACTUELLES", margin, yPosition)
        yPosition += 10

        pdf.setDrawColor(200, 200, 200)
        pdf.line(margin, yPosition, pageWidth - margin, yPosition)
        yPosition += 15

        pdf.setFontSize(11)
        pdf.setFont("helvetica", "normal")

        pdf.setFont("helvetica", "bold")
        pdf.text("Titre du contrat:", leftColumn, yPosition)
        pdf.setFont("helvetica", "normal")
        pdf.text((player.contract as any).title || "Contrat joueur", leftColumn + 35, yPosition)

        pdf.setFont("helvetica", "bold")
        pdf.text("Statut:", rightColumn, yPosition)
        pdf.setFont("helvetica", "normal")
        pdf.text((player.contract as any).status || "Actif", rightColumn + 40, yPosition)
        yPosition += 8

        pdf.setFont("helvetica", "bold")
        pdf.text("Salaire mensuel:", leftColumn, yPosition)
        pdf.setFont("helvetica", "normal")
        pdf.text(formatCurrency(Number(player.contract.salary)), leftColumn + 35, yPosition)

        if (player.contract.signatureBonus) {
            pdf.setFont("helvetica", "bold")
            pdf.text("Prime signature:", rightColumn, yPosition)
            pdf.setFont("helvetica", "normal")
            pdf.text(formatCurrency(player.contract.signatureBonus), rightColumn + 40, yPosition)
        }
        yPosition += 8

        pdf.setFont("helvetica", "bold")
        pdf.text("Date début:", leftColumn, yPosition)
        pdf.setFont("helvetica", "normal")
        pdf.text(formatDate(player.contract.startDate), leftColumn + 35, yPosition)

        pdf.setFont("helvetica", "bold")
        pdf.text("Date fin:", rightColumn, yPosition)
        pdf.setFont("helvetica", "normal")
        pdf.text(formatDate(player.contract.endDate), rightColumn + 40, yPosition)
        yPosition += 20
    }

    // Statistics section
    if (yPosition > 200) {
        pdf.addPage()
        yPosition = 85 // Adjusted from 30 to 85 for top padding
    }

    pdf.setFontSize(16)
    pdf.setFont("helvetica", "bold")
    pdf.text("STATISTIQUES", margin, yPosition)
    yPosition += 10

    pdf.setDrawColor(200, 200, 200)
    pdf.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 15

    pdf.setFontSize(11)
    pdf.setFont("helvetica", "normal")

    const matchesPlayed = player.matchParticipations?.length || 0
    const objectivesCompleted = player.objectiveProgress?.filter((p) => p.completedAt)?.length || 0
    const totalObjectives = player.objectiveProgress?.length || 0
    const successRate = totalObjectives > 0 ? Math.round((objectivesCompleted / totalObjectives) * 100) : 0

    pdf.setFont("helvetica", "bold")
    pdf.text("Matchs joués:", leftColumn, yPosition)
    pdf.setFont("helvetica", "normal")
    pdf.text(matchesPlayed.toString(), leftColumn + 35, yPosition)

    pdf.setFont("helvetica", "bold")
    pdf.text("Objectifs réalisés:", rightColumn, yPosition)
    pdf.setFont("helvetica", "normal")
    pdf.text(`${objectivesCompleted}/${totalObjectives}`, rightColumn + 40, yPosition)
    yPosition += 8

    pdf.setFont("helvetica", "bold")
    pdf.text("Taux de réussite:", leftColumn, yPosition)
    pdf.setFont("helvetica", "normal")
    pdf.text(`${successRate}%`, leftColumn + 35, yPosition)
    yPosition += 20

    // Check if we need space for footer and signatures
    const remainingSpace = pageHeight - yPosition - 40;
    if (remainingSpace < 40) {
        pdf.addPage();
        yPosition = 85; // Adjusted from 20 to 85 for top padding
    }

    // Add manual footer since the utility methods are private
    const footerStartY = pageHeight - 40;

    // Confidential notice
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    pdf.setFont('helvetica', 'italic');

    const confidentialLines = [
        `Document généré par le système ${clubInfo.name}`,
        'Ce document est confidentiel. Toute reproduction ou diffusion est interdite sans autorisation écrite du club.',
        'Conforme aux dispositions légales en vigueur'
    ];

    confidentialLines.forEach((line, index) => {
        pdf.text(line, margin, footerStartY + (index * 4));
    });

    // Club information
    const clubInfoY = footerStartY + 15;
    pdf.setFontSize(9);
    pdf.setTextColor(0, 0, 0);

    pdf.setFont('helvetica', 'bold');
    pdf.text(clubInfo.name, margin, clubInfoY);

    pdf.setFont('helvetica', 'normal');
    pdf.text(clubInfo.address, margin, clubInfoY + 5);
    pdf.text(`${clubInfo.contactPhone} - ${clubInfo.contactEmail}`, margin, clubInfoY + 10);

    // Document reference at bottom
    pdf.setFontSize(8);
    pdf.text(`FICHE-JOUEUR-${player.id}-${new Date().toISOString().split("T")[0]}`, margin, pageHeight - 5);

    // Save the PDF
    pdf.save(`Fiche_Joueur_${player.firstName}_${player.lastName}_${new Date().toISOString().split("T")[0]}.pdf`)
    return Promise.resolve()
}