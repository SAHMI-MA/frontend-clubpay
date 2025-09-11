// Test script for the new financial report PDF
// This can be run in the browser console to test the PDF generation

const testFinancialReportPDF = async () => {
  try {
    console.log('🧪 Testing Financial Report PDF Generation...');
    
    // Import the new PDF generator
    const { generateFinancialReportPDF } = await import('./lib/jsPDF/FinancialReportPDF.js');
    
    // Create sample report data
    const sampleReportData = {
      id: 12345,
      periodStart: '2024-01-01',
      periodEnd: '2024-12-31',
      totalIncome: 150000,
      totalExpenses: 120000,
      netProfit: 30000,
      title: 'Rapport Financier Annuel 2024',
      incomeBreakdown: {
        'Cotisations des membres': 50000,
        'Sponsoring': 40000,
        'Ventes de billets': 35000,
        'Merchandising': 15000,
        'Subventions': 10000
      },
      expenseBreakdown: {
        'Salaires': 60000,
        'Équipements': 25000,
        'Infrastructure': 20000,
        'Transport': 10000,
        'Marketing': 5000
      },
      generatedBy: {
        id: 1,
        username: 'admin',
        firstName: 'Ahmed',
        lastName: 'Benali'
      },
      createdAt: new Date().toISOString(),
      notes: 'Ce rapport présente les résultats financiers excellents de l\'année 2024. Les revenus ont augmenté de 15% par rapport à l\'année précédente, principalement grâce aux nouveaux contrats de sponsoring et à l\'augmentation des cotisations.'
    };
    
    // Generate the PDF
    console.log('📄 Generating PDF with sample data...');
    await generateFinancialReportPDF(sampleReportData);
    
    console.log('✅ PDF generation completed successfully!');
    console.log('📁 Check your downloads folder for the generated PDF file.');
    
    return true;
  } catch (error) {
    console.error('❌ Error testing PDF generation:', error);
    return false;
  }
};

// Export for testing
if (typeof window !== 'undefined') {
  window.testFinancialReportPDF = testFinancialReportPDF;
  console.log('💡 Test function available as window.testFinancialReportPDF()');
}
