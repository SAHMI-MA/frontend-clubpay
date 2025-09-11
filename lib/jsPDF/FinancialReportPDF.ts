import { PDFGenerator, ClubInfo, DEFAULT_CLUB_INFO } from './pdf-export-utils';
import { formatCurrency } from '../pdf-utils';

export interface FinancialReportData {
  id: number;
  periodStart: string;
  periodEnd: string;
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  title: string;
  incomeBreakdown?: Record<string, number>;
  expenseBreakdown?: Record<string, number>;
  generatedBy?: {
    id: number;
    username: string;
    firstName?: string;
    lastName?: string;
  };
  createdAt: string;
  notes?: string;
}

export class FinancialReportPDFGenerator extends PDFGenerator {
  constructor(clubInfo: ClubInfo = DEFAULT_CLUB_INFO) {
    super(clubInfo);
  }

  private formatCurrencyAmount(amount: number): string {
    // Use the centralized currency formatting from pdf-utils
    return formatCurrency(amount);
  }

  private addFinancialSummarySection(reportData: FinancialReportData, yPosition: number): number {
    const pageHeight = this.getDocument().internal.pageSize.height;
    const footerSpace = 80; // Reserve more space for footer to avoid overlap
    
    // Check if we need a new page
    if (yPosition + 60 > pageHeight - footerSpace) {
      yPosition = this.addNewPageWithHeader();
    }

    // Add section header
    yPosition = this.addFinancialSectionHeader("RÉSUMÉ FINANCIER", yPosition);

    // Summary data with proper color coding
    const summaryData = [
      ["Total des Recettes:", this.formatCurrencyAmount(reportData.totalIncome || 0), "green"],
      ["Total des Dépenses:", this.formatCurrencyAmount(reportData.totalExpenses || 0), "red"],
      ["Bénéfice Net:", this.formatCurrencyAmount(reportData.netProfit || 0), reportData.netProfit >= 0 ? "green" : "red"],
    ];

    const doc = this.getDocument();
    doc.setFontSize(11);

    summaryData.forEach(([label, value, color]) => {
      // Check if we need a new page for each item
      if (yPosition + 10 > pageHeight - footerSpace) {
        yPosition = this.addNewPageWithHeader();
      }

      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(label, 25, yPosition);

      // Set color based on type
      if (color === "green") {
        doc.setTextColor(34, 197, 94); // Green
      } else if (color === "red") {
        doc.setTextColor(239, 68, 68); // Red
      }

      doc.text(value, 105, yPosition);
      yPosition += 10;
    });

    return yPosition + 15;
  }

  private addBreakdownSection(
    title: string, 
    breakdown: Record<string, number>, 
    yPosition: number, 
    colorType: 'green' | 'red'
  ): number {
    if (!breakdown || Object.keys(breakdown).length === 0) {
      return yPosition;
    }

    const pageHeight = this.getDocument().internal.pageSize.height;
    const footerSpace = 80;
    
    // Check if section header will fit
    if (yPosition + 40 > pageHeight - footerSpace) {
      yPosition = this.addNewPageWithHeader();
    }

    // Add section header
    yPosition = this.addFinancialSectionHeader(title, yPosition);

    const doc = this.getDocument();
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    Object.entries(breakdown).forEach(([category, amount]) => {
      // Check if this item will fit on current page
      if (yPosition + 8 > pageHeight - footerSpace) {
        yPosition = this.addNewPageWithHeader();
      }

      // Category name in black
      doc.setTextColor(0, 0, 0);
      doc.text(category, 25, yPosition);

      // Amount in appropriate color
      if (colorType === 'green') {
        doc.setTextColor(34, 197, 94); // Green
      } else {
        doc.setTextColor(239, 68, 68); // Red
      }
      doc.text(this.formatCurrencyAmount(amount), 125, yPosition);

      yPosition += 8;
    });

    return yPosition + 15;
  }

  private addMetadataSection(reportData: FinancialReportData, yPosition: number): number {
    const pageHeight = this.getDocument().internal.pageSize.height;
    const footerSpace = 80;
    
    // Check if section will fit
    if (yPosition + 60 > pageHeight - footerSpace) {
      yPosition = this.addNewPageWithHeader();
    }

    // Add section header
    yPosition = this.addFinancialSectionHeader("INFORMATIONS DU RAPPORT", yPosition);

    const doc = this.getDocument();
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);

    const details: Array<[string, string]> = [];

    if (reportData.generatedBy) {
      const generatedByText = `${reportData.generatedBy.firstName || ""} ${reportData.generatedBy.lastName || ""} (${reportData.generatedBy.username || ""})`.trim();
      details.push(["Généré par:", generatedByText]);
    }

    if (reportData.createdAt) {
      const createdAtText = new Date(reportData.createdAt).toLocaleString("fr-FR");
      details.push(["Date de création:", createdAtText]);
    }

    // Add details using the custom method
    yPosition = this.addFinancialDetailsSection(details, yPosition);

    // Add notes if present
    if (reportData.notes) {
      // Check if notes section will fit
      if (yPosition + 30 > pageHeight - footerSpace) {
        yPosition = this.addNewPageWithHeader();
      }

      doc.setFont("helvetica", "bold");
      doc.text("Notes:", 25, yPosition);
      yPosition += 8;

      doc.setFont("helvetica", "normal");
      const maxWidth = doc.internal.pageSize.width - 50;
      const noteLines = doc.splitTextToSize(reportData.notes, maxWidth);
      
      // Check if all note lines will fit
      if (yPosition + (noteLines.length * 5) > pageHeight - footerSpace) {
        yPosition = this.addNewPageWithHeader();
      }
      
      doc.text(noteLines, 25, yPosition);
      yPosition += noteLines.length * 5;
    }

    return yPosition + 15;
  }

  private addFinancialSectionHeader(title: string, yPosition: number): number {
    const doc = this.getDocument();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;

    // Add some space before section
    yPosition += 5;

    // Draw header background
    doc.setFillColor(248, 250, 252); // Light gray background
    doc.rect(margin, yPosition - 2, pageWidth - 2 * margin, 12, 'F');

    // Draw header text
    doc.setTextColor(30, 58, 138); // Blue color matching the header
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(title, margin + 5, yPosition + 6);

    // Add line under header
    doc.setDrawColor(226, 232, 240); // Light border
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition + 10, pageWidth - margin, yPosition + 10);

    return yPosition + 20; // Extra spacing after header
  }

  private addFinancialDetailsSection(details: Array<[string, string]>, yPosition: number): number {
    const doc = this.getDocument();
    const pageHeight = doc.internal.pageSize.height;
    const footerSpace = 80;

    details.forEach(([label, value]) => {
      // Check if we need a new page
      if (yPosition + 8 > pageHeight - footerSpace) {
        yPosition = this.addNewPageWithHeader();
      }

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(label, 25, yPosition);
      
      doc.setFont('helvetica', 'normal');
      const maxWidth = doc.internal.pageSize.width - 90;
      const splitText = doc.splitTextToSize(value, maxWidth);
      
      // Check if the text will fit on current page
      if (yPosition + (splitText.length * 5) > pageHeight - footerSpace) {
        yPosition = this.addNewPageWithHeader();
      }
      
      doc.text(splitText, 70, yPosition);
      yPosition += Math.max(splitText.length * 5, 8);
    });

    return yPosition;
  }

  public async generateFinancialReportPDF(reportData: FinancialReportData): Promise<void> {
    try {
      // Initialize the PDF generator
      await this.initialize();

      // Create header with document information
      const documentNumber = `FIN-${reportData.id}-${new Date().getFullYear()}`;
      const documentDate = new Date().toLocaleDateString('fr-FR');
      const documentTitle = reportData.title || "RAPPORT FINANCIER";

      await this.createHeader(documentTitle, documentNumber, documentDate);

      // Start content after header
      let yPosition = 70; // Start after header with safe margin

      const doc = this.getDocument();
      const margin = 20;

      // Add report period information
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      const periodText = `Période: ${new Date(reportData.periodStart).toLocaleDateString("fr-FR")} - ${new Date(reportData.periodEnd).toLocaleDateString("fr-FR")}`;
      doc.text(periodText, margin, yPosition);
      yPosition += 20;

      // Add financial summary section
      yPosition = this.addFinancialSummarySection(reportData, yPosition);

      // Add income breakdown
      if (reportData.incomeBreakdown) {
        yPosition = this.addBreakdownSection(
          "RÉPARTITION DES RECETTES",
          reportData.incomeBreakdown,
          yPosition,
          'green'
        );
      }

      // Add expense breakdown
      if (reportData.expenseBreakdown) {
        yPosition = this.addBreakdownSection(
          "RÉPARTITION DES DÉPENSES",
          reportData.expenseBreakdown,
          yPosition,
          'red'
        );
      }

      // Add metadata section
      yPosition = this.addMetadataSection(reportData, yPosition);

      // Add footer to all pages (this also handles page numbering and prevents overlap)
      this.addFooter(documentNumber);

      // Generate filename and save
      const fileName = `rapport-financier-${reportData.title?.replace(/\s+/g, "-").toLowerCase() || "rapport"}-${new Date().toISOString().split("T")[0]}.pdf`;
      doc.save(fileName);

    } catch (error) {
      console.error("Error generating financial report PDF:", error);
      throw new Error("Erreur lors de la génération du PDF. Veuillez réessayer.");
    }
  }
}

// Export convenience function for direct use
export async function generateFinancialReportPDF(reportData: FinancialReportData, clubInfo?: ClubInfo): Promise<void> {
  const generator = new FinancialReportPDFGenerator(clubInfo);
  await generator.generateFinancialReportPDF(reportData);
}
