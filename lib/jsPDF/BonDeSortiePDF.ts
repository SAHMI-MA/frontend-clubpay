import autoTable from "jspdf-autotable";
import { associationAPI } from "../api/association-api";
import { Allocation } from "../api/stock-api";
import { DEFAULT_CLUB_INFO, PDFGenerator } from "./pdf-export-utils";

export async function generateBonDeSortiePDF(allocation: Allocation): Promise<void> {
  const clubInfo = await associationAPI.getSettings() || DEFAULT_CLUB_INFO;
  const generator = new PDFGenerator(clubInfo);
  await generator.initialize();

  const doc = generator.getDocument();
  let yPosition = 20;

  const currentDate = allocation.allocationDate ?
    new Date(allocation.allocationDate).toLocaleDateString('fr-FR') :
    new Date().toLocaleDateString('fr-FR');

  // Add header
  await generator.createHeader(
    'BON DE SORTIE',
    String(allocation.allocationNumber || allocation.id),
    currentDate
  );
  yPosition = 50;

  // Club and Entity information
  const clubInfoLines = [
    clubInfo.address,
    clubInfo.contactPhone ? `Tél: ${clubInfo.contactPhone}` : '',
    clubInfo.contactEmail ? `Email: ${clubInfo.contactEmail}` : ''
  ].filter(Boolean);

  const entityLines = [
    allocation.entityName || getEntityName(allocation),
    allocation.allocationType === 'Player' && allocation.playerId ? `Licence: ${allocation.playerId}` : '',
    allocation.allocationType === 'Staff' && allocation.staffId ? `ID Staff: ${allocation.staffId}` : '',
    allocation.allocationType === 'Employee' && allocation.employeeId ? `Matricule: ${allocation.employeeId}` : ''
  ].filter(Boolean);

  yPosition = generator['addTwoColumnSection'](
    'INFORMATIONS DU CLUB',
    clubInfoLines,
    'INFORMATIONS BÉNÉFICIAIRE',
    entityLines,
    yPosition
  );

  // Allocation details
  yPosition = generator['addSectionHeader']('DÉTAILS DE L\'ALLOCATION', yPosition);

  const details: Array<[string, string]> = [
    ['Type:', getAllocationTypeLabel(allocation.allocationType)],
    ['Durée:', allocation.allocationDuration === 'Temporary' ? 'Temporaire' : 'Permanente'],
    ['Statut:', getAllocationStatusLabel(allocation.status)],
    ['Date de sortie:', allocation.allocationDate ? new Date(allocation.allocationDate).toLocaleDateString('fr-FR') : currentDate],
    ['Date retour prévue:', allocation.expectedReturnDate ? new Date(allocation.expectedReturnDate).toLocaleDateString('fr-FR') : 'N/A'],
    ['Date retour effective:', allocation.actualReturnDate ? new Date(allocation.actualReturnDate).toLocaleDateString('fr-FR') : 'N/A'],
    ['Alloué par:', allocation.allocatedBy || 'Non spécifié'],
    ['Approuvé par:', allocation.approvedBy || 'Non approuvé'],
    ['Notes:', allocation.notes || 'Aucune']
  ];

  yPosition = generator['addDetailsSection'](details, yPosition);

  // Items table
  if (allocation.items?.length) {
    yPosition = generator['addSectionHeader']('MATÉRIEL ALLOUÉ', yPosition);

    const tableData = allocation.items.map((item, idx) => {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unitPrice) || 0;
      const totalValue = Number(item.totalValue) || quantity * unitPrice;

      return [
        (idx + 1).toString(),
        item.articleName || 'Article non spécifié',
        item.articleCode || '-',
        quantity.toString(),
        unitPrice ? `${unitPrice.toFixed(2)} MAD` : '-',
        `${totalValue.toFixed(2)} MAD`,
        item.allocatedAt ? new Date(item.allocatedAt).toLocaleDateString('fr-FR') : '-',
        item.returnedAt ? new Date(item.returnedAt).toLocaleDateString('fr-FR') : '-',
        item.notes || '-'
      ];
    });

    autoTable(doc, {
      startY: yPosition,
      head: [['#', 'Article', 'Référence', 'Quantité', 'Valeur unitaire', 'Valeur totale', 'Date sortie', 'Date retour', 'Notes']],
      body: tableData,
      margin: { left: generator['margin'], right: generator['margin'] },
      theme: 'grid',
      headStyles: {
        fillColor: generator['primaryColor'],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9
      },
      bodyStyles: {
        fontSize: 8,
        textColor: 50
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 35 },
        2: { cellWidth: 20 },
        3: { cellWidth: 15, halign: 'center' },
        4: { cellWidth: 22, halign: 'right' },
        5: { cellWidth: 22, halign: 'right' },
        6: { cellWidth: 18 },
        7: { cellWidth: 18 },
        8: { cellWidth: 22 }
      }
    });

    yPosition = (doc as any).lastAutoTable?.finalY + 10 || yPosition + 50;

    // Total section if we have prices
    if (allocation.items.some(item => item.unitPrice)) {
      const totalValue = allocation.items.reduce((sum, item) => {
        return sum + (Number(item.totalValue) || (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0));
      }, 0);

      yPosition = generator['addTotalSection'](totalValue, yPosition);
    }
  }

  // Ensure space and add footer/signatures
  yPosition = generator['ensureSpaceForSignatures'](yPosition);
  generator['addFooterAndSignatures'](`Bon de sortie N° ${allocation.allocationNumber || allocation.id}`, 'Bénéficiaire');

  // Save the PDF
  const fileName = `bon-sortie-${allocation.allocationNumber || allocation.id}.pdf`;
  doc.save(fileName);
}



// Utility functions
const getEntityName = (allocation: Allocation): string => {
  if (allocation.entityName) return allocation.entityName;
  if (allocation.teamId) return `Équipe #${allocation.teamId}`;
  if (allocation.playerId) return `Joueur #${allocation.playerId}`;
  if (allocation.staffId) return `Staff #${allocation.staffId}`;
  if (allocation.employeeId) return `Employé #${allocation.employeeId}`;
  return 'Non spécifié';
};

const getAllocationTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    'Club': 'Club',
    'Player': 'Joueur',
    'Staff': 'Staff',
    'Employee': 'Employé'
  };
  return labels[type] || type;
};

const getAllocationStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    'Pending': 'En attente',
    'Approved': 'Approuvée',
    'Rejected': 'Rejetée',
    'In Use': 'En cours',
    'Returned': 'Retournée',
    'Cancelled': 'Annulée'
  };
  return labels[status] || status;
};