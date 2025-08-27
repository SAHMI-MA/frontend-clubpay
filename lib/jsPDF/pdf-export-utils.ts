import { apiConfig } from '../api-config';
const { jsPDF } = await import('jspdf');

// Interfaces
export interface ClubInfo {
  legalIdentifiers: string;
  name: string;
  nameInArabic: string;
  foundedAt: Date | string; // Allow string to handle potential input formats
  address: string;
  contactPhone: string;
  contactEmail: string;
  website?: string;
  logoUrl?: string;
  headerUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export interface AcquisitionForPDF {
  id: number;
  acquisitionName: string;
  description: string;
  acquisitionType: string;
  startDate: string;
  endDate?: string;
  totalCost: number;
  approvalStatus: string;
  createdAt: string;
  supplier?: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
  };
  acquisitionSupplies?: Array<{
    supply: {
      name: string;
      description: string;
    };
    quantity: number;
    unitPrice: number;
  }>;
  team?: { name: string };
  player?: { firstName: string; lastName: string };
  staff?: { firstName: string; lastName: string };
  employee?: { fullName: string };
}

// Default club information
export const DEFAULT_CLUB_INFO: ClubInfo = {
  name: "Info.com",
  nameInArabic: "إنفو.كوم",
  foundedAt: new Date('2000-01-01'), // Ensure Date object
  address: "123 Stadium Road, CasaBlanca",
  contactPhone: "1234567890",
  contactEmail: "base@info.com",
  website: "www.info.com",
  logoUrl: undefined,
  headerUrl: undefined,
  legalIdentifiers: ''
};

// Common PDF utilities
export class PDFGenerator {
  private doc: any;
  private clubInfo: ClubInfo;
  private pageWidth: number;
  private margin: number = 20;
  private primaryColor: string;
  private secondaryColor: string;
  private accentColor: string = '#F8FAFC';
  private logoImageData: string | null = null;
  private headerImageData: string | null = null;

  constructor(clubInfo: ClubInfo) {
    this.doc = new jsPDF();
    this.clubInfo = {
      ...clubInfo,
      // Ensure foundedAt is a Date object
      foundedAt: typeof clubInfo.foundedAt === 'string' ? new Date(clubInfo.foundedAt) : clubInfo.foundedAt,
    };
    this.pageWidth = this.doc.internal.pageSize.width;
    this.primaryColor = clubInfo.primaryColor || '#1E40AF';
    this.secondaryColor = clubInfo.secondaryColor || '#64748B';
  }

  private addLine(y: number, color: string = '#E2E8F0'): void {
    this.doc.setDrawColor(color);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, y, this.pageWidth - this.margin, y);
  }

  private async loadLogo(): Promise<void> {
    if (!this.clubInfo?.logoUrl) {
      this.logoImageData = null;
      return;
    }

    try {
      let logoUrl = this.clubInfo.logoUrl;
      if (!/^https?:\/\//.test(logoUrl) && !/^data:image\/(png|jpg|jpeg);base64,/.test(logoUrl)) {
        logoUrl = apiConfig.baseUrl + (logoUrl.startsWith('/') ? logoUrl : `/${logoUrl}`);
      }

      let imageData = logoUrl;
      if (!/^data:image\/(png|jpg|jpeg);base64,/.test(logoUrl)) {
        const response = await fetch(logoUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch logo: ${response.status}`);
        }
        const blob = await response.blob();
        imageData = await this.blobToBase64(blob);
      }

      this.logoImageData = imageData;
    } catch (error) {
      console.warn('Could not load logo:', error);
      this.logoImageData = null;
    }
  }

  private addLogoToHeader(): void {
    if (this.logoImageData) {
      try {
        // Add logo in header area with proper positioning
        this.doc.addImage(this.logoImageData, 'PNG', 10, 5, 30, 30);
      } catch (error) {
        console.warn('Error adding logo to header:', error);
        this.addDefaultLogo();
      }
    } else {
      this.addDefaultLogo();
    }
  }

  private async loadHeader(): Promise<void> {
    if (!this.clubInfo?.headerUrl) {
      this.headerImageData = null;
      return;
    }

    try {
      let headerUrl = this.clubInfo.headerUrl;
      if (!/^https?:\/\//.test(headerUrl) && !/^data:image\/(png|jpg|jpeg);base64,/.test(headerUrl)) {
        headerUrl = apiConfig.baseUrl + (headerUrl.startsWith('/') ? headerUrl : `/${headerUrl}`);
      }

      let imageData = headerUrl;
      if (!/^data:image\/(png|jpg|jpeg);base64,/.test(headerUrl)) {
        const response = await fetch(headerUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch header: ${response.status}`);
        }
        const blob = await response.blob();
        imageData = await this.blobToBase64(blob);
      }

      this.headerImageData = imageData;
    } catch (error) {
      console.warn('Could not load header:', error);
      this.headerImageData = null;
    }
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject('Failed to convert image to base64');
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private addDefaultHeader(documentTitle: string, documentNumber: string, date: string): void {
    // Header background
    this.doc.setFillColor(this.primaryColor);
    this.doc.rect(0, 0, this.pageWidth, 40, 'F');

    // Add logo on top of header background
    this.addLogoToHeader();

    // Club name and title (positioned to the right of logo)
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(this.clubInfo.name, 50, 16);

    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(documentTitle, 50, 26);

    this.doc.setFontSize(10);
    this.doc.text(`N° ${documentNumber}`, 50, 34);

    // Date in top right
    this.doc.setFontSize(10);
    this.doc.text(`Date: ${date}`, this.pageWidth - 60, 20);
  }

  private addHeaderImage(): void {
    if (this.headerImageData) {
      try {
        this.doc.addImage(this.headerImageData, 'PNG', 0, 0, this.pageWidth, 40); // Full width, 40px height
      } catch (error) {
        console.warn('Error adding header image:', error);
      }
    }
  }

  private addTitle(documentTitle: string, yPosition: number): number {
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(documentTitle, this.margin, yPosition);
    return yPosition + 10;
  }

  private addDefaultLogo(): void {
    // Create a simple default logo
    this.doc.setFillColor(255, 255, 255);
    this.doc.circle(25, 20, 12, 'F');
    
    // Add border to the circle
    this.doc.setDrawColor(200, 200, 200);
    this.doc.setLineWidth(1);
    this.doc.circle(25, 20, 12, 'S');
    
    // Add "LOGO" text
    this.doc.setTextColor(100, 100, 100);
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('LOGO', 20, 22);
  }

  private async addHeader(documentTitle: string, documentNumber: string, date: string): Promise<void> {
    await this.loadHeader();
    if (this.headerImageData) {
      this.addHeaderImage();
      // Add title below the header
      let yPosition = 50; // Start below the 40px header with some padding
      yPosition = this.addTitle(documentTitle, yPosition);

      // Add document number and date
      this.doc.setFontSize(10);
      this.doc.text(`N° ${documentNumber}`, this.margin, yPosition);
      this.doc.text(`Date: ${date}`, this.pageWidth - 60, yPosition, { align: 'right' });
    } else {
      this.addDefaultHeader(documentTitle, documentNumber, date);
    }
  }

  private addTwoColumnSection(
    leftTitle: string,
    leftLines: string[],
    rightTitle: string,
    rightLines: string[],
    yPosition: number
  ): number {
    const columnWidth = (this.pageWidth - 3 * this.margin) / 2;

    this.doc.setTextColor(0, 0, 0);
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(leftTitle, this.margin, yPosition);
    this.doc.text(rightTitle, this.margin + columnWidth + this.margin, yPosition);

    yPosition += 8;

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');

    const maxLines = Math.max(leftLines.length, rightLines.length);

    leftLines.forEach((line, index) => {
      if (line) this.doc.text(line, this.margin, yPosition + (index * 5));
    });

    rightLines.forEach((line, index) => {
      if (line) this.doc.text(line, this.margin + columnWidth + this.margin, yPosition + (index * 5));
    });

    return yPosition + maxLines * 5 + 15;
  }

  private addSectionHeader(title: string, yPosition: number): number {
    this.addLine(yPosition - 5);
    yPosition += 5;

    // Draw header background
    this.doc.setFillColor(this.accentColor);
    this.doc.rect(this.margin, yPosition - 2, this.pageWidth - 2 * this.margin, 8, 'F');

    // Draw header text
    this.doc.setTextColor(this.primaryColor);
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, this.margin + 2, yPosition + 4);

    // Add extra bottom padding after header
    return yPosition + 24; // Increased from 14 to 24 for more padding
  }

  private addDetailsSection(details: Array<[string, string]>, yPosition: number): number {
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFontSize(10);

    details.forEach(([label, value]) => {
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(label, this.margin + 5, yPosition);
      this.doc.setFont('helvetica', 'normal');

      const maxWidth = this.pageWidth - this.margin - 80;
      const splitText = this.doc.splitTextToSize(value, maxWidth);
      this.doc.text(splitText, this.margin + 40, yPosition);
      yPosition += splitText.length * 5;
    });

    return yPosition + 15;
  }

  private addTotalSection(totalValue: number, yPosition: number): number {
    this.doc.setFillColor(this.primaryColor);
    this.doc.rect(this.pageWidth - 120, yPosition, 100, 20, 'F');

    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('VALEUR TOTALE:', this.pageWidth - 110, yPosition + 8);
    this.doc.text(`${totalValue.toFixed(2)} MAD`, this.pageWidth - 110, yPosition + 16);

    return yPosition + 35;
  }

  private addSection(title: string, content: string, yPosition: number): number {
    this.doc.setTextColor(this.primaryColor);
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, this.margin, yPosition);
    yPosition += 10;

    this.doc.setTextColor(0, 0, 0);
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    const lines = this.doc.splitTextToSize(content, this.pageWidth - 2 * this.margin);
    this.doc.text(lines, this.margin, yPosition);
    yPosition += lines.length * 5 + 10;

    return yPosition;
  }

   public addFooter(documentNumber: string): void {
    const pageHeight = this.doc.internal.pageSize.height;
    const currentY = this.doc.getCurrentPageInfo().y || 0;
    const minFooterSpace = 50; // Minimum space required for footer
    const footerStartY = pageHeight - minFooterSpace;

    // Ensure footer doesn't overlap with content
    if (currentY > footerStartY - minFooterSpace) {
      this.doc.addPage();
      this.addFooter(documentNumber); // Recursively add footer on new page
      return;
    }

    // Move confidential lines to extreme right
    this.doc.setFontSize(8);
    this.doc.setTextColor(100, 100, 100);
    this.doc.setFont('helvetica', 'italic');
    const confidentialLines = [
      `Document généré par le système ${this.clubInfo.name}`,
      'Ce document est confidentiel. Toute reproduction ou diffusion est interdite sans autorisation écrite du club.',
      'Conforme aux dispositions légales en vigueur'
    ];
    const maxLineWidth = confidentialLines.reduce((max, line) => Math.max(max, this.doc.getTextWidth(line)), 0);
    const rightX = this.pageWidth - this.margin - maxLineWidth;
    confidentialLines.forEach((line, index) => {
      this.doc.text(line, rightX, footerStartY + (index * 4));
    });

    // Add file name below confidential lines
    const fileName = documentNumber.replace(/[^a-zA-Z0-9-]/g, '-'); // Sanitize filename
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(fileName, rightX, footerStartY + confidentialLines.length * 4 + 4);

    // Add separating line
    this.addLine(footerStartY + confidentialLines.length * 4 + 10);

    // Add vertically stacked club info below the line, centered
    this.doc.setFontSize(9);
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFont('helvetica', 'normal');
    const clubInfoLines = [
      this.clubInfo.name,
      this.clubInfo.address,
      this.clubInfo.contactPhone + " - " + this.clubInfo.contactEmail,
      this.clubInfo.legalIdentifiers || ''
    ];
    clubInfoLines.forEach((line, index) => {
      this.doc.text(
      line,
      this.pageWidth / 2,
      footerStartY + confidentialLines.length * 4 + 14 + (index * 5),
      { align: 'center' }
      );
    });
  }

  private addFooterAndSignatures(documentNumber: string, beneficiaryLabel: string = 'Bénéficiaire'): void {
    const yPosition = this.ensureSpaceForSignatures(20);
    this.addSignatures(yPosition, beneficiaryLabel);
    this.addFooter(documentNumber);
  }

  public ensureSpaceForSignatures(currentY: number): number {
    const remainingSpace = this.doc.internal.pageSize.height - currentY - 80;
    if (remainingSpace < 80) {
      this.doc.addPage();
      return 20;
    }
    return currentY;
  }

  public addSignatures(yPosition: number, beneficiaryLabel: string = 'Bénéficiaire'): number {
    this.doc.setFontSize(10);
    this.doc.setTextColor(this.secondaryColor);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Signatures:', this.margin, yPosition);

    this.doc.setDrawColor(this.secondaryColor);
    this.doc.setLineWidth(0.5);

    this.doc.rect(this.margin, yPosition + 5, 80, 25);
    this.doc.text('Responsable Club:', this.margin + 2, yPosition + 15);
    this.doc.text('Date:', this.margin + 2, yPosition + 20);
    this.doc.text('Signature:', this.margin + 2, yPosition + 25);

    this.doc.rect(this.pageWidth - this.margin - 80, yPosition + 5, 80, 25);
    this.doc.text(`${beneficiaryLabel}:`, this.pageWidth - this.margin - 78, yPosition + 15);
    this.doc.text('Date:', this.pageWidth - this.margin - 78, yPosition + 20);
    this.doc.text('Signature:', this.pageWidth - this.margin - 78, yPosition + 25);

    return yPosition + 35;
  }

  public getDocument() {
    return this.doc;
  }

  public async initialize(): Promise<void> {
    await Promise.all([this.loadLogo(), this.loadHeader()]);
  }

  public async createHeader(documentTitle: string, documentNumber: string, date: string): Promise<void> {
    await this.addHeader(documentTitle, documentNumber, date);
  }

  public addContent(content: { title: string; text: string }[], yPosition: number): number {
    content.forEach(section => {
      yPosition = this.addSection(section.title, section.text, yPosition);
    });
    return yPosition;
  }
}

export async function loadClubLogo(): Promise<string | null> {
  try {
    return null;
  } catch (error) {
    console.warn('Could not load club logo:', error);
    return null;
  }
}

export function getLogoPath(): string {
  return '/logos/club-logo.png';
}