const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate Invoice PDF
 * Returns a Buffer containing the PDF data
 */
async function generateInvoicePDF(invoiceData) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
      });

      const chunks = [];

      // Capture PDF data
      doc.on('data', (chunk) => {
        chunks.push(chunk);
      });

      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve(pdfBuffer);
      });

      doc.on('error', reject);

      // --- PDF Content ---

      // Header
      doc.fontSize(24)
        .font('Helvetica-Bold')
        .text('ConsultaPro', 50, 50);

      doc.fontSize(10)
        .font('Helvetica')
        .text('Expert Consultations Simplified', 50, 80);

      // Invoice Title
      doc.fontSize(18)
        .font('Helvetica-Bold')
        .text('INVOICE', 400, 50);

      // Invoice Details Box
      doc.fontSize(10)
        .font('Helvetica');

      const invoiceY = 90;
      doc.rect(400, invoiceY - 5, 140, 60)
        .stroke();

      doc.text(`Invoice #: ${invoiceData.invoiceNumber}`, 410, invoiceY);
      doc.text(`Date: ${invoiceData.date}`, 410, invoiceY + 20);
      doc.text(`Payment ID: ${invoiceData.paymentId.substring(0, 15)}...`, 410, invoiceY + 40);

      // Divider
      doc.moveTo(50, 170)
        .lineTo(545, 170)
        .stroke();

      // Bill To Section
      doc.fontSize(12)
        .font('Helvetica-Bold')
        .text('BILL TO', 50, 190);

      doc.fontSize(10)
        .font('Helvetica');
      doc.text(`Email: ${invoiceData.userEmail}`, 50, 215);
      doc.text(`Status: ${invoiceData.status}`, 50, 235);

      // Divider
      doc.moveTo(50, 270)
        .lineTo(545, 270)
        .stroke();

      // Items Table Header
      const tableTop = 290;
      const col1 = 50;
      const col2 = 350;
      const col3 = 450;
      const col4 = 500;

      doc.fontSize(11)
        .font('Helvetica-Bold')
        .fillColor('#0066CC');

      // Draw table header background
      doc.rect(col1 - 10, tableTop - 5, 505, 25)
        .fillAndStroke('#3b82f6', '#3b82f6');

      doc.fillColor('white')
        .text('Description', col1, tableTop)
        .text('Quantity', col2, tableTop)
        .text('Unit Price', col3, tableTop)
        .text('Amount', col4, tableTop);

      // Table Body
      doc.fillColor('#000000')
        .font('Helvetica');

      let yPosition = tableTop + 35;

      // Credits Line Item
      doc.text(`${invoiceData.credits} Credits`, col1, yPosition);
      doc.text('1', col2, yPosition);
      doc.text(`₹${invoiceData.amount}`, col3, yPosition);
      doc.text(`₹${invoiceData.amount}`, col4, yPosition);

      yPosition += 25;

      // Bonus Line Item (if applicable)
      if (invoiceData.bonus > 0) {
        doc.fontSize(10);
        doc.text(`${invoiceData.bonus} Bonus Credits`, col1, yPosition)
          .fillColor('#16a34a')
          .text('FREE', col2, yPosition)
          .text('₹0', col3, yPosition)
          .text('₹0', col4, yPosition);
        doc.fillColor('#000000');
        yPosition += 25;
      }

      // Divider
      doc.moveTo(col1 - 10, yPosition)
        .lineTo(545, yPosition)
        .stroke();

      yPosition += 15;

      // Summary Section
      doc.fontSize(11)
        .font('Helvetica');

      doc.text('Subtotal:', col3, yPosition)
        .text(`₹${invoiceData.amount}`, col4, yPosition);

      yPosition += 25;

      if (invoiceData.bonus > 0) {
        doc.text('Bonus Credits:', col3, yPosition)
          .fillColor('#16a34a')
          .text('FREE', col4, yPosition);
        doc.fillColor('#000000');
        yPosition += 25;
      }

      // Total
      doc.fontSize(12)
        .font('Helvetica-Bold')
        .rect(col3 - 5, yPosition - 5, 95, 25)
        .fillAndStroke('#E8F3FF', '#3b82f6');

      doc.fillColor('#000000')
        .text('Total Amount:', col3, yPosition)
        .text(`₹${invoiceData.amount}`, col4, yPosition);

      yPosition += 40;

      // Payment Status Box
      doc.fillColor('#16a34a')
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('✓ Payment Status: SUCCESS', 50, yPosition);

      doc.fillColor('#000000')
        .fontSize(10)
        .font('Helvetica')
        .text('Your credits have been automatically added to your wallet.', 50, yPosition + 20);

      // Credits Summary
      yPosition += 60;
      doc.fontSize(11)
        .font('Helvetica-Bold')
        .text('CREDITS SUMMARY', 50, yPosition);

      yPosition += 25;
      doc.fontSize(10)
        .font('Helvetica')
        .text(`Credits Purchased: ${invoiceData.credits}`, 50, yPosition)
        .text(`Bonus Credits: ${invoiceData.bonus}`, 50, yPosition + 20)
        .fillColor('#16a34a')
        .font('Helvetica-Bold')
        .text(`Total Credits Added: ${invoiceData.totalCredits}`, 50, yPosition + 40);

      // Footer Divider
      doc.moveTo(50, yPosition + 70)
        .lineTo(545, yPosition + 70)
        .fillColor('#000000')
        .stroke();

      // Footer
      doc.fontSize(9)
        .font('Helvetica')
        .fillColor('#666666')
        .text('If you have any questions about this invoice, please contact our support team.', 50, yPosition + 85)
        .text('© 2026 ConsultaPro. All rights reserved.', 50, yPosition + 105, { align: 'center' })
        .text(`Generated on ${new Date().toLocaleString('en-IN')}`, 50, yPosition + 120, { align: 'center' });

      // Finalize
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  generateInvoicePDF,
};
