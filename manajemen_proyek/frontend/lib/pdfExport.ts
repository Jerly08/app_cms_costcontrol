import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Project, Purchase, CashflowItem, formatCurrency } from './dummyData';

// Export Dashboard Report
export const exportDashboardPDF = async (
  projects: Project[],
  totalEstimated: number,
  totalActual: number,
  totalVariance: number
) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Header
  pdf.setFillColor(37, 99, 235); // Primary color
  pdf.rect(0, 0, pageWidth, 40, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.text('Cost Control CMS', pageWidth / 2, 15, { align: 'center' });
  
  pdf.setFontSize(14);
  pdf.text('Dashboard Report', pageWidth / 2, 25, { align: 'center' });
  
  pdf.setFontSize(10);
  const date = new Date().toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  pdf.text(`Generated: ${date}`, pageWidth / 2, 33, { align: 'center' });

  // Summary Section
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(16);
  pdf.text('Summary Overview', 15, 55);

  pdf.setFontSize(11);
  let yPos = 65;

  // Summary boxes
  const summaryData = [
    { label: 'Total Estimasi', value: formatCurrency(totalEstimated) },
    { label: 'Total Aktual', value: formatCurrency(totalActual) },
    {
      label: 'Variance',
      value: `${totalVariance > 0 ? '+' : ''}${totalVariance.toFixed(2)}%`,
    },
  ];

  summaryData.forEach((item, index) => {
    const xPos = 15 + index * 60;
    pdf.setFillColor(249, 250, 251);
    pdf.rect(xPos, yPos, 55, 20, 'F');
    pdf.setFontSize(9);
    pdf.setTextColor(107, 114, 128);
    pdf.text(item.label, xPos + 3, yPos + 8);
    pdf.setFontSize(11);
    pdf.setTextColor(0, 0, 0);
    pdf.text(item.value, xPos + 3, yPos + 16);
  });

  // Projects Table
  yPos = 95;
  pdf.setFontSize(16);
  pdf.setTextColor(0, 0, 0);
  pdf.text('Daftar Proyek', 15, yPos);

  yPos += 10;
  pdf.setFontSize(9);
  pdf.setFillColor(243, 244, 246);
  pdf.rect(15, yPos, pageWidth - 30, 8, 'F');

  // Table Headers
  pdf.setTextColor(55, 65, 81);
  pdf.text('Nama Proyek', 17, yPos + 5);
  pdf.text('Estimasi', 90, yPos + 5);
  pdf.text('Aktual', 125, yPos + 5);
  pdf.text('Var %', 155, yPos + 5);
  pdf.text('Progress', 175, yPos + 5);

  yPos += 10;

  // Table Rows
  projects.forEach((project, index) => {
    if (yPos > pageHeight - 30) {
      pdf.addPage();
      yPos = 20;
    }

    const variance = ((project.actualCost - project.estimatedCost) / project.estimatedCost) * 100;
    const bgColor = index % 2 === 0 ? 255 : 249;
    pdf.setFillColor(bgColor, bgColor, bgColor);
    pdf.rect(15, yPos - 5, pageWidth - 30, 8, 'F');

    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(8);
    
    // Truncate long project names
    const projectName = project.name.length > 30 ? project.name.substring(0, 27) + '...' : project.name;
    pdf.text(projectName, 17, yPos);
    pdf.text(formatCurrency(project.estimatedCost), 90, yPos);
    pdf.text(formatCurrency(project.actualCost), 125, yPos);
    
    pdf.setTextColor(variance > 0 ? 220 : 34, variance > 0 ? 38 : 197, variance > 0 ? 38 : 94);
    pdf.text(`${variance > 0 ? '+' : ''}${variance.toFixed(1)}%`, 155, yPos);
    
    pdf.setTextColor(37, 99, 235);
    pdf.text(`${project.progress}%`, 175, yPos);

    yPos += 8;
  });

  // Footer
  pdf.setFontSize(8);
  pdf.setTextColor(156, 163, 175);
  pdf.text(
    'Cost Control Construction Management System',
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );

  // Save PDF
  pdf.save(`Dashboard-Report-${new Date().getTime()}.pdf`);
};

// Export Projects Report
export const exportProjectsPDF = async (projects: Project[]) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Header
  pdf.setFillColor(37, 99, 235);
  pdf.rect(0, 0, pageWidth, 35, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(20);
  pdf.text('Projects Report', pageWidth / 2, 15, { align: 'center' });
  
  pdf.setFontSize(10);
  pdf.text(`Total Proyek: ${projects.length}`, pageWidth / 2, 25, { align: 'center' });

  let yPos = 50;

  projects.forEach((project, index) => {
    if (yPos > pageHeight - 60) {
      pdf.addPage();
      yPos = 20;
    }

    // Project Card
    pdf.setFillColor(249, 250, 251);
    pdf.rect(15, yPos, pageWidth - 30, 50, 'F');

    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(14);
    pdf.text(project.name, 20, yPos + 10);

    // Status Badge
    const statusColors: any = {
      'On Track': [34, 197, 94],
      'Warning': [234, 179, 8],
      'Over Budget': [239, 68, 68],
    };
    const color = statusColors[project.status] || [156, 163, 175];
    pdf.setFillColor(color[0], color[1], color[2], 0.2);
    pdf.rect(150, yPos + 5, 35, 7, 'F');
    pdf.setTextColor(color[0], color[1], color[2]);
    pdf.setFontSize(9);
    pdf.text(project.status, 167, yPos + 9, { align: 'center' });

    // Details
    pdf.setTextColor(107, 114, 128);
    pdf.setFontSize(9);
    pdf.text('Periode:', 20, yPos + 20);
    pdf.text('Estimasi:', 20, yPos + 28);
    pdf.text('Aktual:', 20, yPos + 36);
    pdf.text('Progress:', 20, yPos + 44);

    pdf.setTextColor(0, 0, 0);
    pdf.text(`${project.startDate} - ${project.endDate}`, 50, yPos + 20);
    pdf.text(formatCurrency(project.estimatedCost), 50, yPos + 28);
    pdf.text(formatCurrency(project.actualCost), 50, yPos + 36);

    // Progress Bar
    pdf.setFillColor(229, 231, 235);
    pdf.rect(50, yPos + 40, 100, 5, 'F');
    pdf.setFillColor(37, 99, 235);
    pdf.rect(50, yPos + 40, (100 * project.progress) / 100, 5, 'F');
    pdf.text(`${project.progress}%`, 155, yPos + 44);

    yPos += 60;
  });

  // Footer
  pdf.setFontSize(8);
  pdf.setTextColor(156, 163, 175);
  const totalPages = pdf.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.text(
      `Halaman ${i} dari ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  pdf.save(`Projects-Report-${new Date().getTime()}.pdf`);
};

// Export Purchasing Report
export const exportPurchasingPDF = async (purchases: Purchase[]) => {
  const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Header
  pdf.setFillColor(37, 99, 235);
  pdf.rect(0, 0, pageWidth, 30, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(20);
  pdf.text('Purchasing Report', pageWidth / 2, 15, { align: 'center' });
  
  pdf.setFontSize(10);
  pdf.text(`Total Transaksi: ${purchases.length}`, pageWidth / 2, 23, { align: 'center' });

  let yPos = 45;

  // Table Headers
  pdf.setFillColor(243, 244, 246);
  pdf.rect(10, yPos - 5, pageWidth - 20, 8, 'F');
  
  pdf.setTextColor(55, 65, 81);
  pdf.setFontSize(9);
  pdf.text('Proyek', 12, yPos);
  pdf.text('Material', 70, yPos);
  pdf.text('Qty', 120, yPos);
  pdf.text('Est. Price', 145, yPos);
  pdf.text('Act. Price', 175, yPos);
  pdf.text('Difference', 205, yPos);
  pdf.text('Vendor', 235, yPos);

  yPos += 8;

  // Table Rows
  purchases.forEach((purchase, index) => {
    if (yPos > pageHeight - 20) {
      pdf.addPage();
      yPos = 20;
    }

    const diff = (purchase.actualPrice - purchase.estimatedPrice) * purchase.quantity;
    const bgColor = index % 2 === 0 ? 255 : 249;
    pdf.setFillColor(bgColor, bgColor, bgColor);
    pdf.rect(10, yPos - 5, pageWidth - 20, 8, 'F');

    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(8);
    
    pdf.text(purchase.projectName.substring(0, 20), 12, yPos);
    pdf.text(purchase.material.substring(0, 15), 70, yPos);
    pdf.text(`${purchase.quantity} ${purchase.unit}`, 120, yPos);
    pdf.text(formatCurrency(purchase.estimatedPrice), 145, yPos);
    pdf.text(formatCurrency(purchase.actualPrice), 175, yPos);
    
    pdf.setTextColor(diff > 0 ? 220 : 34, diff > 0 ? 38 : 197, diff > 0 ? 38 : 94);
    pdf.text(formatCurrency(Math.abs(diff)), 205, yPos);
    
    pdf.setTextColor(107, 114, 128);
    pdf.text(purchase.vendor.substring(0, 18), 235, yPos);

    yPos += 8;
  });

  pdf.save(`Purchasing-Report-${new Date().getTime()}.pdf`);
};

// Export Cashflow Report
export const exportCashflowPDF = async (cashflows: CashflowItem[]) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const totalIncome = cashflows.reduce((sum, c) => sum + c.income, 0);
  const totalExpense = cashflows.reduce((sum, c) => sum + c.expense, 0);
  const netBalance = totalIncome - totalExpense;

  // Header
  pdf.setFillColor(37, 99, 235);
  pdf.rect(0, 0, pageWidth, 40, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(20);
  pdf.text('Cashflow Report', pageWidth / 2, 15, { align: 'center' });
  
  pdf.setFontSize(10);
  pdf.text(`Periode: ${cashflows[0]?.month} - ${cashflows[cashflows.length - 1]?.month}`, pageWidth / 2, 25, { align: 'center' });

  // Summary
  let yPos = 50;
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(14);
  pdf.text('Summary', 15, yPos);
  
  yPos += 10;
  pdf.setFontSize(11);
  pdf.text(`Total Pemasukan: ${formatCurrency(totalIncome)}`, 20, yPos);
  yPos += 7;
  pdf.text(`Total Pengeluaran: ${formatCurrency(totalExpense)}`, 20, yPos);
  yPos += 7;
  pdf.setTextColor(netBalance >= 0 ? 34 : 220, netBalance >= 0 ? 197 : 38, netBalance >= 0 ? 94 : 38);
  pdf.text(`Saldo Bersih: ${formatCurrency(netBalance)}`, 20, yPos);

  // Table
  yPos += 15;
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(14);
  pdf.text('Detail Cashflow', 15, yPos);
  
  yPos += 8;
  pdf.setFillColor(243, 244, 246);
  pdf.rect(15, yPos - 5, pageWidth - 30, 8, 'F');
  
  pdf.setTextColor(55, 65, 81);
  pdf.setFontSize(9);
  pdf.text('Proyek', 17, yPos);
  pdf.text('Bulan', 80, yPos);
  pdf.text('Pemasukan', 110, yPos);
  pdf.text('Pengeluaran', 145, yPos);
  pdf.text('Saldo', 175, yPos);

  yPos += 8;

  cashflows.forEach((cf, index) => {
    if (yPos > pageHeight - 20) {
      pdf.addPage();
      yPos = 20;
    }

    const bgColor = index % 2 === 0 ? 255 : 249;
    pdf.setFillColor(bgColor, bgColor, bgColor);
    pdf.rect(15, yPos - 5, pageWidth - 30, 8, 'F');

    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(8);
    pdf.text(cf.projectName.substring(0, 22), 17, yPos);
    pdf.text(cf.month, 80, yPos);
    
    pdf.setTextColor(34, 197, 94);
    pdf.text(formatCurrency(cf.income), 110, yPos);
    
    pdf.setTextColor(239, 68, 68);
    pdf.text(formatCurrency(cf.expense), 145, yPos);
    
    pdf.setTextColor(cf.balance >= 0 ? 34 : 220, cf.balance >= 0 ? 197 : 38, cf.balance >= 0 ? 94 : 38);
    pdf.text(formatCurrency(cf.balance), 175, yPos);

    yPos += 8;
  });

  pdf.save(`Cashflow-Report-${new Date().getTime()}.pdf`);
};
