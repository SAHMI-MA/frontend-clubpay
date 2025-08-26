import autoTable from "jspdf-autotable";
import { associationAPI } from "../api/association-api";
import { AcquisitionForPDF, DEFAULT_CLUB_INFO, PDFGenerator } from "./pdf-export-utils";

export async function generatePurchaseOrderPDF(acquisition: AcquisitionForPDF): Promise<void> {
  const clubInfo = await associationAPI.getSettings() || DEFAULT_CLUB_INFO;
  const generator = new PDFGenerator(clubInfo);
  await generator.initialize();

  const doc = generator.getDocument();
  let yPosition = 85; // Adjusted from 20 to 85 to account for top padding

  const currentDate = new Date().toLocaleDateString('fr-FR');

  // Add header
  await generator.createHeader(
    'BON DE RÉCEPTION',
    acquisition.id.toString().padStart(6, '0'),
    currentDate
  );

  // Club and Supplier information
  const clubInfoLines = [
    clubInfo.address,
    clubInfo.contactPhone ? `Tél: ${clubInfo.contactPhone}` : '',
    clubInfo.contactEmail ? `Email: ${clubInfo.contactEmail}` : ''
  ].filter(Boolean);

  const supplierLines = acquisition.supplier ? [
    acquisition.supplier.name,
    acquisition.supplier.address || '',
    acquisition.supplier.phone ? `Tél: ${acquisition.supplier.phone}` : '',
    acquisition.supplier.email ? `Email: ${acquisition.supplier.email}` : ''
  ].filter(line => line.trim() !== '') : [];

  yPosition = generator['addTwoColumnSection'](
    'INFORMATIONS DU CLUB',
    clubInfoLines,
    'INFORMATIONS FOURNISSEUR',
    supplierLines,
    yPosition
  );

  // Acquisition details
  yPosition = generator['addSectionHeader']('DÉTAILS DE L\'ACQUISITION', yPosition);

  // Get assignee information
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

  const details: Array<[string, string]> = [
    ['Nom:', acquisition.acquisitionName],
    ['Type:', acquisition.acquisitionType === 'RENTAL' ? 'Location' : 'Achat'],
    ['Description:', acquisition.description],
    ['Date de début:', new Date(acquisition.startDate).toLocaleDateString('fr-FR')],
    ['Date de fin:', acquisition.endDate ? new Date(acquisition.endDate).toLocaleDateString('fr-FR') : 'N/A'],
    ['Statut:', getStatusLabel(acquisition.approvalStatus)],
    ['Affecté à:', assignee]
  ];

  yPosition = generator['addDetailsSection'](details, yPosition);

  // Supplies table
  if (acquisition.acquisitionSupplies && acquisition.acquisitionSupplies.length > 0) {
    yPosition = generator['addSectionHeader']('FOURNITURES COMMANDÉES', yPosition);

    const tableData = acquisition.acquisitionSupplies.map(supply => {
      const quantity = Number(supply.quantity) || 0;
      const unitPrice = Number(supply.unitPrice) || 0;
      const total = quantity * unitPrice;

      return [
        supply.supply.name,
        quantity.toString(),
        `${unitPrice.toFixed(2)} MAD`,
        `${total.toFixed(2)} MAD`
      ];
    });

    autoTable(doc, {
      startY: yPosition,
      head: [['Fourniture', 'Quantité', 'Prix unitaire', 'Total']],
      body: tableData,
      margin: { left: generator['margin'], right: generator['margin'] },
      theme: 'grid',
      headStyles: {
        fillColor: generator['primaryColor'],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 10
      },
      bodyStyles: {
        fontSize: 9,
        textColor: 50
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      styles: {
        cellPadding: 4,
        valign: 'middle',
        halign: 'left'
      },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 35, halign: 'right' },
        3: { cellWidth: 35, halign: 'right' }
      }
    });

    yPosition = (doc as any).lastAutoTable?.finalY + 10 || yPosition + 50;

    // Total section
    const totalCost = acquisition.acquisitionSupplies.reduce((sum, supply) => {
      const quantity = Number(supply.quantity) || 0;
      const unitPrice = Number(supply.unitPrice) || 0;
      return sum + (quantity * unitPrice);
    }, 0);

    yPosition = generator['addTotalSection'](totalCost, yPosition);
  }

  // Ensure space and add footer/signatures
  yPosition = generator['ensureSpaceForSignatures'](yPosition);
  generator['addFooterAndSignatures'](`Bon de réception N° ${acquisition.id.toString().padStart(6, '0')}`, 'Fournisseur');

  // Save the PDF
  const fileName = `bon-reception-${acquisition.id.toString().padStart(6, '0')}.pdf`;
  doc.save(fileName);
}

const getStatusLabel = (status: string): string => {
  const statusLabels: Record<string, string> = {
    'PENDING': 'En attente',
    'APPROVED': 'Approuvée',
    'REJECTED': 'Rejetée',
    'DELIVERED': 'Livrée',
    'RETURNED': 'Retournée',
    'CANCELLED': 'Annulée'
  };
  return statusLabels[status] || status;
};