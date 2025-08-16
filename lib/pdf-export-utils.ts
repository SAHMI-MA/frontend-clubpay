import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ...existing code...
import { associationAPI } from './api/association-api';
import { apiConfig } from './api-config';
import { Allocation } from './api/stock-api';

export interface ClubInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  logoUrl?: string;
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

// Default club information - you can modify this or make it configurable
const DEFAULT_CLUB_INFO: ClubInfo = {
  name: "Club Sportif",
  address: "123 Rue du Sport, Casablanca, Maroc",
  phone: "+212 5 22 XX XX XX",
  email: "contact@clubsportif.ma",
  website: "www.clubsportif.ma",
  logoUrl: undefined
};

/**
 * Generate Bon de Sortie PDF for an allocation
 * @param allocation Allocation object
 */
export async function generateBonDeSortiePDF(allocation: Allocation) {
  const clubInfo = await associationAPI.getSettings() || DEFAULT_CLUB_INFO;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  let yPosition = 20;

  // Colors
  const primaryColor = clubInfo.primaryColor || '#1E40AF';

  // Header Section
  doc.setFillColor(primaryColor);
  doc.rect(0, 0, pageWidth, 40, 'F');

  // Club logo (if logoUrl is provided, load and display it)
  if (clubInfo && clubInfo.logoUrl) {
    try {
      let logoUrl = clubInfo.logoUrl;
      if (!/^https?:\/+/.test(logoUrl) && !/^data:image\/(png|jpg|jpeg);base64,/.test(logoUrl)) {
        logoUrl = apiConfig.baseUrl + (logoUrl.startsWith('/') ? logoUrl : `/${logoUrl}`);
      }
      let imageData = logoUrl;
      if (!/^data:image\/(png|jpg|jpeg);base64,/.test(logoUrl)) {
        const response = await fetch(logoUrl);
        const blob = await response.blob();
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onloadend = () => {
            if (typeof reader.result === 'string') resolve(reader.result);
            else reject('Failed to convert logo to base64');
          };
          reader.onerror = reject;
        });
        reader.readAsDataURL(blob);
        imageData = await base64Promise;
      }
      doc.addImage(imageData, 'PNG', 15, 10, 25, 25);
    } catch (err) {
      console.error('[PDF] Error loading club logo:', err);
      doc.setFillColor(255, 255, 255);
      doc.circle(30, 20, 10, 'F');
      doc.setTextColor(primaryColor);
      doc.setFontSize(8);
      doc.text('LOGO', 26, 22);
    }
  } else {
    doc.setFillColor(255, 255, 255);
    doc.circle(30, 20, 10, 'F');
    doc.setTextColor(primaryColor);
    doc.setFontSize(8);
    doc.text('LOGO', 26, 22);
  }

  // Club name and title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(clubInfo.name, 50, 16);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('BON DE SORTIE', 50, 26);
  doc.setFontSize(10);
  doc.text(`N° ${allocation.allocationNumber || allocation.id}`, 50, 34);

  // Date in top right
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  const currentDate = allocation.createdAt ? new Date(allocation.createdAt).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR');
  doc.text(`Date: ${currentDate}`, pageWidth - 60, 20);

  yPosition = 50;

  // Club information section
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMATIONS DE L’ASSOCIATION', margin, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(clubInfo.address, margin, yPosition);
  yPosition += 5;
  if (clubInfo.contactPhone) {
    doc.text(`Tél: ${clubInfo.contactPhone}`, margin, yPosition);
    yPosition += 5;
  }
  if (clubInfo.contactEmail) {
    doc.text(`Email: ${clubInfo.contactEmail}`, margin, yPosition);
    yPosition += 5;
  }
  yPosition += 10;

  // Allocation details section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('DÉTAILS DE L’ALLOCATION', margin, yPosition);
  yPosition += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Type: ${allocation.allocationType}`, margin, yPosition);
  yPosition += 5;
  doc.text(`Durée: ${allocation.allocationDuration}`, margin, yPosition);
  yPosition += 5;
  if (allocation.expectedReturnDate) {
    doc.text(`Retour prévu: ${new Date(allocation.expectedReturnDate).toLocaleDateString('fr-FR')}`, margin, yPosition);
    yPosition += 5;
  }
  if (allocation.actualReturnDate) {
    doc.text(`Retour effectif: ${new Date(allocation.actualReturnDate).toLocaleDateString('fr-FR')}`, margin, yPosition);
    yPosition += 5;
  }
  if (allocation.entityName) {
    doc.text(`Entité: ${allocation.entityName}`, margin, yPosition);
    yPosition += 5;
  }
  if (allocation.user?.name) {
    doc.text(`Utilisateur: ${allocation.user.name}`, margin, yPosition);
    yPosition += 5;
  }
  if (allocation.allocatedBy) {
    doc.text(`Alloué par: ${allocation.allocatedBy}`, margin, yPosition);
    yPosition += 5;
  }
  if (allocation.approvedBy) {
    doc.text(`Approuvé par: ${allocation.approvedBy}`, margin, yPosition);
    yPosition += 5;
  }
  if (allocation.notes) {
    doc.text(`Notes: ${allocation.notes}`, margin, yPosition);
    yPosition += 5;
  }
  yPosition += 10;

  // Items table
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('ARTICLES SORTIS', margin, yPosition);
  yPosition += 8;

  let tableData: string[][] = [];
  if (Array.isArray(allocation.items) && allocation.items.length > 0) {
    tableData = allocation.items.map((item: any, idx: number) => {
      let code = item.articleCode || item.article?.code || '-';
      if (code === '-' && item.articleId) code = String(item.articleId);
      console.log('[PDF] Allocation Item:', item);
      console.log('[PDF] Computed articleCode:', code, 'articleId:', item.articleId);
      return [
        (idx + 1).toString(),
        item.articleName || item.article?.name || '-',
        code,
        item.quantity !== undefined && item.quantity !== null ? item.quantity.toString() : '-',
        typeof item.unitPrice === 'number' ? item.unitPrice.toFixed(2) : (item.unitPrice ? String(item.unitPrice) : '-'),
        typeof item.totalValue === 'number' ? item.totalValue.toFixed(2) : (item.totalValue ? String(item.totalValue) : '-'),
        item.allocatedAt ? new Date(item.allocatedAt).toLocaleDateString('fr-FR') : '-',
        item.returnedAt ? new Date(item.returnedAt).toLocaleDateString('fr-FR') : '-',
        item.notes ? item.notes : '-',
      ];
    });
  } else {
    // Fallback for single allocation item (AllocationItem shape)
    const item = allocation as any;
    const code = item.article?.code || item.articleCode || '-';
    console.log('[PDF] Single Allocation Item:', item);
    console.log('[PDF] Computed articleCode:', code);
    tableData = [[
      '1',
      item.article?.name || item.articleName || '-',
      code,
      item.quantity !== undefined && item.quantity !== null ? item.quantity.toString() : '-',
      typeof item.unitPrice === 'number' ? item.unitPrice.toFixed(2) : (item.unitPrice ? String(item.unitPrice) : '-'),
      typeof item.totalValue === 'number' ? item.totalValue.toFixed(2) : (item.totalValue ? String(item.totalValue) : '-'),
      item.startDate ? new Date(item.startDate).toLocaleDateString('fr-FR') : (item.allocatedAt ? new Date(item.allocatedAt).toLocaleDateString('fr-FR') : '-'),
      item.endDate ? new Date(item.endDate).toLocaleDateString('fr-FR') : (item.returnedAt ? new Date(item.returnedAt).toLocaleDateString('fr-FR') : '-'),
      item.notes ? item.notes : '-',
    ]];
  }

  autoTable(doc, {
    startY: yPosition,
    head: [['#', 'Article', 'Code', 'Quantité', 'Prix Unitaire', 'Valeur Totale', 'Date Allocation', 'Date Retour', 'Notes']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: 255,
      fontSize: 10,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 9,
      textColor: 50
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { left: margin, right: margin },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 28 },
      2: { cellWidth: 18 },
      3: { halign: 'center', cellWidth: 18 },
      4: { halign: 'right', cellWidth: 22 },
      5: { halign: 'right', cellWidth: 22 },
      6: { cellWidth: 22 },
      7: { cellWidth: 22 },
      8: { cellWidth: 28 },
    },
    tableWidth: pageWidth - 2 * margin,
  });

  // Footer
  const footerY = doc.internal.pageSize.height - 40;
  doc.setDrawColor(primaryColor);
  doc.setLineWidth(0.5);
  doc.line(margin, footerY - 10, pageWidth - margin, footerY - 10);
  doc.setTextColor(primaryColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Signature du responsable:', margin, footerY);
  doc.rect(margin, footerY + 5, 80, 25);
  doc.text('Signature:', margin + 2, footerY + 20);

  doc.setFontSize(8);
  doc.setTextColor(primaryColor);
  doc.text(
    `Document généré le ${new Date().toLocaleDateString('fr-FR')} - Bon de Sortie N° ${allocation.allocationNumber || allocation.id}`,
    margin,
    doc.internal.pageSize.height - 10
  );

  // Save the PDF
  const fileName = `bon-de-sortie-${allocation.allocationNumber || allocation.id}.pdf`;
  doc.save(fileName);
}

export async function generatePurchaseOrderPDF(
  acquisition: AcquisitionForPDF,
): Promise<void> {
  const clubInfo = await associationAPI.getSettings() || DEFAULT_CLUB_INFO;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  let yPosition = 20;

  // Colors
  const primaryColor = clubInfo.primaryColor; // Blue-800
  const secondaryColor = clubInfo.secondaryColor; // Slate-500
  const accentColor = '#f8fafc'; // Slate-50

  // Helper function to add a horizontal line
  const addLine = (y: number, color: string = '#e2e8f0') => {
    doc.setDrawColor(color);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
  };

  // Header Section
  doc.setFillColor(primaryColor);
  doc.rect(0, 0, pageWidth, 40, 'F');

  // Club logo (if logoUrl is provided, load and display it)
  if (clubInfo && clubInfo.logoUrl) {
    try {
      // If logoUrl is a base64 string, use it directly
      // If logoUrl is a URL, fetch and convert to base64;
      let logoUrl = clubInfo.logoUrl;
      if (!/^https?:\/\//.test(logoUrl) && !/^data:image\/(png|jpg|jpeg);base64,/.test(logoUrl)) {
        logoUrl = apiConfig.baseUrl + (logoUrl.startsWith('/') ? logoUrl : `/${logoUrl}`);
      }
      console.log('[PDF] Club logo URL:', logoUrl);
      let imageData = logoUrl;
      if (!/^data:image\/(png|jpg|jpeg);base64,/.test(logoUrl)) {
        // Try to fetch and convert to base64
        const response = await fetch(logoUrl);
        const blob = await response.blob();
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onloadend = () => {
            if (typeof reader.result === 'string') resolve(reader.result);
            else reject('Failed to convert logo to base64');
          };
          reader.onerror = reject;
        });
        reader.readAsDataURL(blob);
        imageData = await base64Promise;
      }
      console.log('[PDF] Club logo imageData:', imageData);
      doc.addImage(imageData, 'PNG', 15, 10, 25, 25);
    } catch (err) {
      console.error('[PDF] Error loading club logo:', err);
      // Fallback to placeholder if logo fails to load
      doc.setFillColor(255, 255, 255);
      doc.circle(30, 20, 10, 'F');
      doc.setTextColor(primaryColor);
      doc.setFontSize(8);
      doc.text('LOGO', 26, 22);
    }
  } else {
    doc.setFillColor(255, 255, 255);
    doc.circle(30, 20, 10, 'F');
    doc.setTextColor(primaryColor);
    doc.setFontSize(8);
    doc.text('LOGO', 26, 22);
  }

  // Club name and title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(clubInfo.name, 50, 16);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('BON DE RÉCEPTION', 50, 26);

  doc.setFontSize(10);
  doc.text(`N° ${acquisition.id.toString().padStart(6, '0')}`, 50, 34);

  // Date in top right
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  const currentDate = new Date().toLocaleDateString('fr-FR');
  doc.text(`Date: ${currentDate}`, pageWidth - 60, 20);

  yPosition = 50;

  // Club information section
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMATIONS DU CLUB', margin, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(clubInfo.address, margin, yPosition);
  yPosition += 5;
  doc.text(`Tél: ${clubInfo.contactPhone}`, margin, yPosition);
  yPosition += 5;
  doc.text(`Email: ${clubInfo.contactEmail}`, margin, yPosition);
  yPosition += 15;

  // Supplier information section
  if (acquisition.supplier) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('FOURNISSEUR', margin, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(acquisition.supplier.name, margin, yPosition);
    yPosition += 5;
    if (acquisition.supplier.address) {
      doc.text(acquisition.supplier.address, margin, yPosition);
      yPosition += 5;
    }
    if (acquisition.supplier.phone) {
      doc.text(`Tél: ${acquisition.supplier.phone}`, margin, yPosition);
      yPosition += 5;
    }
    if (acquisition.supplier.email) {
      doc.text(`Email: ${acquisition.supplier.email}`, margin, yPosition);
      yPosition += 5;
    }
    yPosition += 10;
  }

  // Acquisition details section
  addLine(yPosition - 5);
  yPosition += 5;

  doc.setFillColor(accentColor);
  doc.rect(margin, yPosition - 2, pageWidth - 2 * margin, 8, 'F');

  doc.setTextColor(primaryColor);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('DÉTAILS DE L\'ACQUISITION', margin + 2, yPosition + 4);
  yPosition += 15;

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const details = [
    ['Nom:', acquisition.acquisitionName],
    ['Type:', acquisition.acquisitionType === 'RENTAL' ? 'Location' : 'Achat'],
    ['Description:', acquisition.description],
    ['Date de début:', new Date(acquisition.startDate).toLocaleDateString('fr-FR')],
    ['Date de fin:', acquisition.endDate ? new Date(acquisition.endDate).toLocaleDateString('fr-FR') : 'N/A'],
    ['Statut:', getStatusLabel(acquisition.approvalStatus)],
  ];

  // Add assignee information
  let assignee = 'Non affecté';
  if (acquisition.team) {
    assignee = `Équipe: ${acquisition.team.name}`;
  } else if (acquisition.player) {
    assignee = `Joueur: ${acquisition.player.firstName} ${acquisition.player.lastName}`;
  } else if (acquisition.staff) {
    assignee = `Staff: ${acquisition.staff.firstName} ${acquisition.staff.lastName}`;
  } else if (acquisition.employee) {
    assignee = `Employé: ${acquisition.employee.fullName}`;
  }
  details.push(['Affecté à:', assignee]);

  details.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, margin + 5, yPosition);
    doc.setFont('helvetica', 'normal');
    
    // Handle long text wrapping
    const maxWidth = pageWidth - margin - 80;
    const splitText = doc.splitTextToSize(value, maxWidth);
    doc.text(splitText, margin + 40, yPosition);
    yPosition += splitText.length * 5;
  });

  yPosition += 10;

  // Supplies table
  if (acquisition.acquisitionSupplies && acquisition.acquisitionSupplies.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor);
    doc.text('FOURNITURES COMMANDÉES', margin, yPosition);
    yPosition += 10;

    // Get the Y position after the table (safe fallback)
    const lastAutoTable = (doc as any).lastAutoTable;
    if (lastAutoTable && typeof lastAutoTable.finalY === 'number') {
      yPosition = lastAutoTable.finalY + 10;
    } else {
      yPosition += 50;
    }

    // Total section
    const totalCost = Number(acquisition.totalCost ?? acquisition.acquisitionSupplies?.reduce((sum, supply) =>
      sum + (Number(supply.quantity ?? 0) * Number(supply.unitPrice ?? 0)), 0
    ) ?? 0);

    doc.setFillColor(primaryColor);
    doc.rect(pageWidth - 120, yPosition, 100, 20, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL:', pageWidth - 110, yPosition + 8);
    doc.text(`${totalCost.toFixed(2)} MAD`, pageWidth - 110, yPosition + 16);

    yPosition += 35;
  }

  // Footer section
  const footerY = doc.internal.pageSize.height - 40;
  addLine(footerY - 10);

  doc.setTextColor(secondaryColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Signatures:', margin, footerY);

  // Signature boxes
  doc.setDrawColor(secondaryColor);
  doc.setLineWidth(0.5);
  
  // Receiver signature
  doc.rect(margin, footerY + 5, 80, 25);
  doc.text('Réceptionnaire:', margin + 2, footerY + 15);
  doc.text('Date:', margin + 2, footerY + 20);
  doc.text('Signature:', margin + 2, footerY + 25);

  // Supplier signature
  doc.rect(pageWidth - margin - 80, footerY + 5, 80, 25);
  doc.text('Fournisseur:', pageWidth - margin - 78, footerY + 15);
  doc.text('Date:', pageWidth - margin - 78, footerY + 20);
  doc.text('Signature:', pageWidth - margin - 78, footerY + 25);

  // Document info footer
  doc.setFontSize(8);
  doc.setTextColor(secondaryColor);
  doc.text(
    `Document généré le ${currentDate} - Bon de réception N° ${acquisition.id.toString().padStart(6, '0')}`,
    margin,
    doc.internal.pageSize.height - 10
  );

  // Save the PDF
  const fileName = `bon-reception-${acquisition.id.toString().padStart(6, '0')}.pdf`;
  doc.save(fileName);
}

// Helper function to get status label in French
function getStatusLabel(status: string): string {
  const statusLabels: { [key: string]: string } = {
    'PENDING': 'En attente',
    'APPROVED': 'Approuvée',
    'REJECTED': 'Rejetée',
    'DELIVERED': 'Livrée',
    'RETURNED': 'Retournée',
    'CANCELLED': 'Annulée'
  };
  return statusLabels[status] || status;
}

// Function to load club logo (you can implement this based on your needs)
export async function loadClubLogo(): Promise<string | null> {
  try {
    // This is a placeholder - you can implement actual logo loading here
    // For example, you might load from public/logos/club-logo.png
    // and convert it to base64 for use in jsPDF
    return null;
  } catch (error) {
    console.warn('Could not load club logo:', error);
    return null;
  }
}

// Alternative function for loading logo from file
export function getLogoPath(): string {
  return '/logos/club-logo.png'; // Adjust this path based on your logo location
}
